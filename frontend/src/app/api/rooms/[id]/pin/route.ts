import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json();
    const { userId, messageId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    if (messageId === null || messageId === undefined || messageId === "") {
      // Unpin message
      await prisma.room.update({
        where: { id: roomId },
        data: { pinnedMessageId: null },
      });

      return NextResponse.json({
        roomId,
        pinnedMessageId: null,
        pinnedMessage: null,
      });
    }

    // Pin message: check message exists
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!message || message.roomId !== roomId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    await prisma.room.update({
      where: { id: roomId },
      data: { pinnedMessageId: messageId },
    });

    const formattedPinnedMessage = {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      userName: message.user.name,
      userAvatar: message.user.avatarUrl || undefined,
      text: message.text || "",
      imageUrl: message.imageUrl || undefined,
      replyTo: (message.replyTo as Record<string, unknown>) || undefined,
      reactions: (message.reactions as Record<string, string[]>) || {},
      createdAt: message.createdAt.toISOString(),
    };

    return NextResponse.json({
      roomId,
      pinnedMessageId: messageId,
      pinnedMessage: formattedPinnedMessage,
    });
  } catch (error) {
    console.error("[PATCH /api/rooms/[id]/pin error]:", error);
    return NextResponse.json(
      { error: "Failed to update pinned message" },
      { status: 500 }
    );
  }
}

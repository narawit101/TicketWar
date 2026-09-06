import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { id: roomId, messageId } = await context.params;
    const body = await req.json();
    const { userId, emoji } = body;

    if (!userId || !emoji) {
      return NextResponse.json(
        { error: "User ID and emoji are required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, roomId: true, reactions: true },
    });

    if (!message || message.roomId !== roomId) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const currentReactions: Record<string, string[]> =
      (message.reactions as Record<string, string[]>) || {};

    const updatedReactions: Record<string, string[]> = {};
    let hadThisEmoji = false;

    for (const [e, users] of Object.entries(currentReactions)) {
      if (!Array.isArray(users)) continue;
      if (e === emoji && users.includes(userId)) {
        hadThisEmoji = true;
      }
      const filtered = users.filter((id) => id !== userId);
      if (filtered.length > 0) {
        updatedReactions[e] = filtered;
      }
    }

    if (!hadThisEmoji) {
      updatedReactions[emoji] = [...(updatedReactions[emoji] || []), userId];
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { reactions: updatedReactions },
    });

    return NextResponse.json({
      messageId,
      reactions: updatedReactions,
    });
  } catch (error) {
    console.error("[POST /reactions error]:", error);
    return NextResponse.json(
      { error: "Failed to toggle reaction" },
      { status: 500 }
    );
  }
}

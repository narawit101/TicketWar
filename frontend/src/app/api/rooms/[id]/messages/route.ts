import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadChatMessageImage, deleteCloudinaryImage } from "@/lib/cloudinary";
import { isSystemShoutout } from "@/lib/validation";

type MessageWithUser = {
  id: string;
  roomId: string;
  userId: string;
  text: string | null;
  imageUrl: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10), 1),
      100
    );

    let cursorDate: Date | null = null;
    if (cursor) {
      const cursorMsg = await prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      if (cursorMsg) {
        cursorDate = cursorMsg.createdAt;
      }
    }

    // ponytail: fetch recent messages in desc order then reverse for chronological display
    const messages = await prisma.message.findMany({
      where: {
        roomId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formatted = [...messages].reverse().map((m: MessageWithUser) => ({
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      userName: m.user.name,
      userAvatar: m.user.avatarUrl || undefined,
      text: m.text || "",
      imageUrl: m.imageUrl || undefined,
      isShoutout: isSystemShoutout(m.text),
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({
      messages: formatted,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("[GET /api/rooms/[id]/messages error]:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json();
    const { userId, text, imageUrl, isShoutout } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    if (!text?.trim() && !imageUrl) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    // Process image or PDF if base64 DataURL (ponytail: single upload handler for both media types)
    let finalImageUrl: string | null = null;
    if (imageUrl && typeof imageUrl === "string") {
      if (imageUrl.startsWith("data:image/") || imageUrl.startsWith("data:application/pdf")) {
        finalImageUrl = await uploadChatMessageImage(imageUrl, roomId);
      } else {
        finalImageUrl = imageUrl;
      }
    }

    const savedMessage = await prisma.message.create({
      data: {
        roomId,
        userId,
        text: text?.trim() || null,
        imageUrl: finalImageUrl,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    const formatted = {
      id: savedMessage.id,
      roomId: savedMessage.roomId,
      userId: savedMessage.userId,
      userName: savedMessage.user.name,
      userAvatar: savedMessage.user.avatarUrl || undefined,
      text: savedMessage.text || "",
      imageUrl: savedMessage.imageUrl || undefined,
      isShoutout: !!isShoutout,
      createdAt: savedMessage.createdAt.toISOString(),
    };

    return NextResponse.json({ message: formatted });
  } catch (error) {
    console.error("[POST /api/rooms/[id]/messages error]:", error);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const { messageId, userId, text } = await req.json();

    if (!messageId || !userId || !text?.trim()) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!msg || msg.roomId !== roomId) {
      return NextResponse.json({ error: "ไม่พบข้อความนี้" }, { status: 404 });
    }

    // Only message owner can edit
    if (msg.userId !== userId) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขข้อความของผู้อื่น" }, { status: 403 });
    }

    // Images cannot be edited, only text
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { text: text.trim() },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({
      message: {
        id: updated.id,
        roomId: updated.roomId,
        userId: updated.userId,
        userName: updated.user.name,
        userAvatar: updated.user.avatarUrl || undefined,
        text: updated.text || "",
        imageUrl: updated.imageUrl || undefined,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[PATCH /api/rooms/[id]/messages error]:", error);
    return NextResponse.json({ error: "ไม่สามารถแก้ไขข้อความได้" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const userId = searchParams.get("userId");

    if (!messageId || !userId) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    const msg = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!msg || msg.roomId !== roomId) {
      return NextResponse.json({ error: "ไม่พบข้อความนี้" }, { status: 404 });
    }

    // Only message owner can delete
    if (msg.userId !== userId) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ลบข้อความของผู้อื่น" }, { status: 403 });
    }

    // ลบรูปออกจาก Cloudinary ด้วย ถ้ามีรูป
    if (msg.imageUrl) {
      await deleteCloudinaryImage(msg.imageUrl);
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("[DELETE /api/rooms/[id]/messages error]:", error);
    return NextResponse.json({ error: "ไม่สามารถลบข้อความได้" }, { status: 500 });
  }
}

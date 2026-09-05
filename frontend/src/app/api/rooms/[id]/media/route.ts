import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSystemShoutout } from "@/lib/validation";

type MessageWithUser = {
  id: string;
  roomId: string;
  userId: string;
  text: string | null;
  imageUrl: string | null;
  replyTo?: unknown;
  reactions?: unknown;
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
    const type = searchParams.get("type") || "photos"; // "photos" | "files" | "all"
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "30", 10), 1),
      60
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

    const whereClause: {
      roomId: string;
      imageUrl: { not: null };
      createdAt?: { lt: Date };
      NOT?: { OR: Array<{ imageUrl: { endsWith?: string; startsWith?: string } }> };
      OR?: Array<{ imageUrl: { endsWith?: string; startsWith?: string } }>;
    } = {
      roomId,
      imageUrl: { not: null },
      ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
    };

    if (type === "photos") {
      whereClause.NOT = {
        OR: [
          { imageUrl: { endsWith: ".pdf" } },
          { imageUrl: { startsWith: "data:application/pdf" } },
        ],
      };
    } else if (type === "files") {
      whereClause.OR = [
        { imageUrl: { endsWith: ".pdf" } },
        { imageUrl: { startsWith: "data:application/pdf" } },
      ];
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    const formatted = items.map((m: MessageWithUser) => {
      return {
        id: m.id,
        roomId: m.roomId,
        userId: m.userId,
        userName: m.user.name,
        userAvatar: m.user.avatarUrl || undefined,
        text: m.text || "",
        imageUrl: m.imageUrl || undefined,
        isShoutout: isSystemShoutout(m.text),
        replyTo: (m.replyTo as Record<string, unknown>) || undefined,
        reactions: (m.reactions as Record<string, string[]>) || {},
        createdAt: m.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      items: formatted,
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error("[GET /api/rooms/[id]/media error]:", error);
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลคลังสื่อได้" },
      { status: 500 }
    );
  }
}

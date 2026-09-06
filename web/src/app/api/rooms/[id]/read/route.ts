import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || req.headers.get("x-user-id");

    if (!userId || !roomId) {
      return NextResponse.json(
        { error: "userId and roomId are required" },
        { status: 400 }
      );
    }

    await prisma.roomMember.updateMany({
      where: { roomId, userId },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/rooms/[id]/read error]:", error);
    return NextResponse.json(
      { error: "Failed to mark room as read" },
      { status: 500 }
    );
  }
}

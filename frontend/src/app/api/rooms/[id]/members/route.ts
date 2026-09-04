import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type MemberWithUser = {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const members = await prisma.roomMember.findMany({
      where: { roomId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: "asc" },
    });

    const formatted = members.map((m: MemberWithUser) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return NextResponse.json({ members: formatted });
  } catch (error) {
    console.error("[GET /api/rooms/[id]/members error]:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const requesterId = searchParams.get("requesterId");

    if (!targetUserId || !requesterId) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน (ต้องการ targetUserId และ requesterId)" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { createdById: true },
    });

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องนี้ในระบบ" }, { status: 404 });
    }

    // Can kick if requester is owner, OR can leave if requesterId === targetUserId
    const isOwner = room.createdById === requesterId;
    const isSelfLeaving = requesterId === targetUserId;

    if (!isOwner && !isSelfLeaving) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ดำเนินการนี้" },
        { status: 403 }
      );
    }

    // Owner cannot leave unless deleting room
    if (targetUserId === room.createdById && isSelfLeaving) {
      return NextResponse.json(
        { error: "หัวห้องไม่สามารถออกจากห้องได้ (กรุณาใช้เมนูลบห้องหากต้องการยกเลิก)" },
        { status: 400 }
      );
    }

    await prisma.roomMember.deleteMany({
      where: {
        roomId,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rooms/[id]/members error]:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการเตะสมาชิก" }, { status: 500 });
  }
}

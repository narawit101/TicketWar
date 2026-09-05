import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;

    const invitations = await prisma.roomInvitation.findMany({
      where: { roomId },
      include: {
        invitee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        inviter: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = invitations.map((inv) => ({
      id: inv.id,
      roomId: inv.roomId,
      inviterId: inv.inviterId,
      inviterName: inv.inviter.name,
      inviteeId: inv.inviteeId,
      inviteeName: inv.invitee.name,
      inviteeEmail: inv.invitee.email,
      inviteeAvatarUrl: inv.invitee.avatarUrl,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      updatedAt: inv.updatedAt.toISOString(),
    }));

    const counts = {
      total: formatted.length,
      pending: formatted.filter((i) => i.status === "PENDING").length,
      accepted: formatted.filter((i) => i.status === "ACCEPTED").length,
      declined: formatted.filter((i) => i.status === "DECLINED").length,
    };

    return NextResponse.json({
      invitations: formatted,
      counts,
    });
  } catch (error) {
    console.error("[GET /api/rooms/[id]/invitations error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดรายการผู้ถูกเชิญ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const { searchParams } = new URL(req.url);
    const invitationId = searchParams.get("invitationId");
    const requesterId = searchParams.get("requesterId");

    if (!invitationId || !requesterId) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน (ต้องการ invitationId และ requesterId)" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { createdById: true },
    });

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องนี้" }, { status: 404 });
    }

    const invitation = await prisma.roomInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.roomId !== roomId) {
      return NextResponse.json(
        { error: "ไม่พบคำเชิญนี้ในห้อง" },
        { status: 404 }
      );
    }

    if (room.createdById !== requesterId && invitation.inviterId !== requesterId) {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการยกเลิกคำเชิญนี้" },
        { status: 403 }
      );
    }

    await prisma.roomInvitation.delete({
      where: { id: invitationId },
    });

    return NextResponse.json({
      success: true,
      message: "ยกเลิกคำเชิญสำเร็จ",
      inviteeId: invitation.inviteeId,
    });
  } catch (error) {
    console.error("[DELETE /api/rooms/[id]/invitations error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยกเลิกคำเชิญ" },
      { status: 500 }
    );
  }
}

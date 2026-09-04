import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/invitations?userId=... - ดึงรายการคำเชิญสถานะ PENDING ของผู้ใช้
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId")?.trim();

    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาระบุ userId" },
        { status: 400 }
      );
    }

    const invitations = await prisma.roomInvitation.findMany({
      where: {
        inviteeId: userId,
        status: "PENDING",
        room: {
          status: { not: "DELETED" },
        },
      },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            bannerUrl: true,
            eventDate: true,
            inviteCode: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = invitations.map((inv: any) => ({
      id: inv.id,
      roomId: inv.roomId,
      roomTitle: inv.room.title,
      roomBannerUrl: inv.room.bannerUrl,
      roomEventDate: inv.room.eventDate
        ? inv.room.eventDate.toISOString()
        : null,
      inviteCode: inv.room.inviteCode,
      inviterId: inv.inviterId,
      inviterName: inv.inviter.name,
      inviterAvatarUrl: inv.inviter.avatarUrl,
      inviteeId: inv.inviteeId,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
    }));

    return NextResponse.json({ invitations: formatted });
  } catch (error) {
    console.error("[GET /api/invitations error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดคำเชิญ" },
      { status: 500 }
    );
  }
}

// POST /api/invitations - ส่งคำเชิญให้ผู้ใช้เข้าห้อง (สามารถส่งทีละหลายคนได้)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roomId, inviterId, inviteeIds } = body;

    if (!roomId || !inviterId || !Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return NextResponse.json(
        { error: "ข้อมูลไม่ครบถ้วน (ต้องการ roomId, inviterId และ inviteeIds)" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        title: true,
        bannerUrl: true,
        eventDate: true,
        inviteCode: true,
        createdById: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "ไม่พบห้องนี้ในระบบ" },
        { status: 404 }
      );
    }

    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { id: true, name: true, avatarUrl: true },
    });

    if (!inviter) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ส่งคำเชิญ" },
        { status: 404 }
      );
    }

    // Upsert or create invitations for each invitee
    const results = [];
    for (const inviteeId of inviteeIds) {
      if (inviteeId === inviterId) continue; // Don't invite self

      // Check if already a member
      const existingMember = await prisma.roomMember.findUnique({
        where: {
          roomId_userId: { roomId, userId: inviteeId },
        },
      });
      if (existingMember) continue;

      const invitation = await prisma.roomInvitation.upsert({
        where: {
          roomId_inviteeId: { roomId, inviteeId },
        },
        create: {
          roomId,
          inviterId,
          inviteeId,
          status: "PENDING",
        },
        update: {
          inviterId,
          status: "PENDING",
        },
        include: {
          invitee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      results.push({
        id: invitation.id,
        roomId: room.id,
        roomTitle: room.title,
        roomBannerUrl: room.bannerUrl,
        roomEventDate: room.eventDate ? room.eventDate.toISOString() : null,
        inviteCode: room.inviteCode,
        inviterId: inviter.id,
        inviterName: inviter.name,
        inviterAvatarUrl: inviter.avatarUrl,
        inviteeId: invitation.inviteeId,
        inviteeName: invitation.invitee.name,
        inviteeEmail: invitation.invitee.email,
        inviteeAvatarUrl: invitation.invitee.avatarUrl,
        status: invitation.status,
        createdAt: invitation.createdAt.toISOString(),
      });
    }

    let chatMessage = null;
    if (results.length > 0) {
      const inviteeNames = results.map((r) => r.inviteeName).filter(Boolean);
      const text = `${inviter.name} ได้เชิญ ${inviteeNames.join(", ")} เข้าร่วมห้อง`;

      // ponytail: persist invitation announcement in room chat
      const savedMsg = await prisma.message.create({
        data: {
          roomId,
          userId: inviterId,
          text,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      });

      chatMessage = {
        id: savedMsg.id,
        roomId: savedMsg.roomId,
        userId: savedMsg.userId,
        userName: savedMsg.user.name,
        userAvatar: savedMsg.user.avatarUrl || undefined,
        text: savedMsg.text || "",
        imageUrl: undefined,
        isShoutout: true,
        createdAt: savedMsg.createdAt.toISOString(),
      };
    }

    return NextResponse.json({
      message: `ส่งคำเชิญสำเร็จ ${results.length} คน`,
      invitations: results,
      chatMessage,
    });
  } catch (error) {
    console.error("[POST /api/invitations error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการส่งคำเชิญ" },
      { status: 500 }
    );
  }
}

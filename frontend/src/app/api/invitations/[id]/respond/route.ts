import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/invitations/[id]/respond - ตอบรับ (ACCEPT) หรือปฏิเสธ (DECLINE) คำเชิญ
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invitationId } = await context.params;
    const body = await req.json();
    const { action, userId } = body;

    if (!action || !["ACCEPT", "DECLINE"].includes(action)) {
      return NextResponse.json(
        { error: "action ต้องเป็น ACCEPT หรือ DECLINE เท่านั้น" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาระบุ userId" },
        { status: 401 }
      );
    }

    const invitation = await prisma.roomInvitation.findUnique({
      where: { id: invitationId },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        invitee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "ไม่พบคำเชิญนี้ หรือคำเชิญถูกยกเลิกแล้ว" },
        { status: 404 }
      );
    }

    if (invitation.inviteeId !== userId) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการตอบรับคำเชิญนี้" },
        { status: 403 }
      );
    }

    if (action === "DECLINE") {
      await prisma.roomInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED" },
      });

      return NextResponse.json({
        message: "ปฏิเสธคำเชิญเรียบร้อยแล้ว",
        status: "DECLINED",
      });
    }

    // ACCEPT action
    // Check if room is active
    if (invitation.room.status === "DELETED") {
      return NextResponse.json(
        { error: "ห้องนี้ถูกลบไปแล้ว" },
        { status: 410 }
      );
    }

    // Add user as RoomMember if not already
    const existingMember = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: invitation.roomId,
          userId,
        },
      },
    });

    let joinedMessage = null;
    if (!existingMember) {
      await prisma.roomMember.create({
        data: {
          roomId: invitation.roomId,
          userId,
          role: "MEMBER",
        },
      });

      // ponytail: persist joined system message
      joinedMessage = await prisma.message.create({
        data: {
          roomId: invitation.roomId,
          userId,
          text: `${invitation.invitee.name} เข้ามาแล้ว`,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    // Update invitation status to ACCEPTED
    await prisma.roomInvitation.update({
      where: { id: invitationId },
      data: { status: "ACCEPTED" },
    });

    const memberCount = await prisma.roomMember.count({
      where: { roomId: invitation.roomId },
    });

    const formattedChatMessage = joinedMessage
      ? {
          id: joinedMessage.id,
          roomId: joinedMessage.roomId,
          userId: joinedMessage.userId,
          userName: joinedMessage.user.name,
          userAvatar: joinedMessage.user.avatarUrl || undefined,
          text: joinedMessage.text || "",
          imageUrl: undefined,
          isShoutout: true,
          createdAt: joinedMessage.createdAt.toISOString(),
        }
      : null;

    return NextResponse.json({
      message: "เข้าร่วมห้องสำเร็จ",
      roomId: invitation.roomId,
      roomTitle: invitation.room.title,
      memberCount,
      user: invitation.invitee,
      inviterId: invitation.inviterId,
      chatMessage: formattedChatMessage,
    });
  } catch (error) {
    console.error("[POST /api/invitations/[id]/respond error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการตอบรับคำเชิญ" },
      { status: 500 }
    );
  }
}

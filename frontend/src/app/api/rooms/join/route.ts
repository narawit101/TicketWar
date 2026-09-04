import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/rooms/join?code=...&userId=... - ดึงข้อมูลพรีวิวห้องและเช็คว่าเป็นสมาชิกแล้วหรือไม่
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();
    const userId = searchParams.get("userId")?.trim();

    if (!code) {
      return NextResponse.json({ error: "กรุณาระบุรหัสห้อง" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: {
        inviteCode: code,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        title: true,
        bannerUrl: true,
        seatingPlanUrl: true,
        eventDate: true,
        status: true,
        inviteCode: true,
        createdById: true,
        owner: {
          select: { name: true },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "ไม่พบห้องนี้ หรือรหัสห้องไม่ถูกต้อง" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าผู้ใช้นี้เป็นสมาชิกอยู่แล้วหรือไม่
    let isMember = false;
    if (userId) {
      const existingMember = await prisma.roomMember.findUnique({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId,
          },
        },
      });
      if (existingMember || room.createdById === userId) {
        isMember = true;
      }
    }

    return NextResponse.json({
      room: {
        id: room.id,
        title: room.title,
        bannerUrl: room.bannerUrl,
        seatingPlanUrl: room.seatingPlanUrl,
        eventDate: room.eventDate ? room.eventDate.toISOString() : null,
        status: room.status,
        inviteCode: room.inviteCode,
        ownerName: room.owner.name,
        memberCount: Math.max(1, room._count.members),
      },
      isMember,
    });
  } catch (error) {
    console.error("[GET /api/rooms/join error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูลห้อง" },
      { status: 500 }
    );
  }
}

// POST /api/rooms/join - เข้าร่วมห้องด้วย Invite Code
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inviteCode, userId } = body;

    if (!inviteCode || typeof inviteCode !== "string" || !inviteCode.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุรหัสคำเชิญ (Invite Code)" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนเข้าร่วมห้อง" },
        { status: 401 }
      );
    }

    const cleanCode = inviteCode.trim();

    // ค้นหาห้องจาก inviteCode
    const room = await prisma.room.findFirst({
      where: {
        inviteCode: cleanCode,
        status: { not: "DELETED" },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdById: true,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "ไม่พบห้องนี้ หรือรหัสห้องไม่ถูกต้อง" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่าผู้ใช้เป็นสมาชิกอยู่แล้วหรือไม่
    const existingMember = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId,
        },
      },
    });

    const joinedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    let joinedMessage = null;
    if (!existingMember) {
      // เพิ่มผู้ใช้เป็นสมาชิกใหม่ (role: MEMBER)
      await prisma.roomMember.create({
        data: {
          roomId: room.id,
          userId,
          role: room.createdById === userId ? "OWNER" : "MEMBER",
        },
      });

      // ponytail: persist entered announcement without emojis
      joinedMessage = await prisma.message.create({
        data: {
          roomId: room.id,
          userId,
          text: `${joinedUser?.name || "สมาชิกใหม่"} เข้ามาแล้ว`,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });
    }

    const memberCount = await prisma.roomMember.count({
      where: { roomId: room.id },
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
      roomId: room.id,
      roomTitle: room.title,
      memberCount,
      user: joinedUser,
      chatMessage: formattedChatMessage,
    });
  } catch (error) {
    console.error("[POST /api/rooms/join error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าร่วมห้อง กรุณาลองใหม่อีกครั้ง" },
      { status: 500 }
    );
  }
}

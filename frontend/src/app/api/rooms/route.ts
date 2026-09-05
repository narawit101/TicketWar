import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { uploadRoomPoster, uploadRoomSeatingPlan } from "@/lib/cloudinary";
import { parseDateInBangkok } from "@/lib/date";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const whereCondition: Prisma.RoomWhereInput = {
      status: { not: "DELETED" },
    };

    if (userId) {
      whereCondition.OR = [
        { createdById: userId },
        { members: { some: { userId } } },
      ];
    }

    const rooms = await prisma.room.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: { members: true, seatTasks: true },
        },
        members: userId
          ? {
              where: { userId },
              select: { role: true, lastReadAt: true },
            }
          : false,
      },
      orderBy: { createdAt: "desc" },
    });

    const unreadCounts = await Promise.all(
      rooms.map((r) => {
        if (!userId) return Promise.resolve(0);
        const lastRead = r.members?.[0]?.lastReadAt || r.createdAt;
        return prisma.message.count({
          where: {
            roomId: r.id,
            createdAt: { gt: lastRead },
            userId: { not: userId },
          },
        });
      })
    );

    const formattedRooms = rooms.map((r, idx: number) => {
      const isOwner =
        r.createdById === userId || r.members?.[0]?.role === "OWNER";
      return {
        id: r.id,
        title: r.title,
        inviteCode: r.inviteCode,
        status: r.status,
        createdById: r.createdById,
        role: isOwner ? "OWNER" : "MEMBER",
        bannerUrl: r.bannerUrl || null,
        seatingPlanUrl: r.seatingPlanUrl || null,
        ticketUrl: r.ticketUrl || null,
        description: r.description || null,
        memberCount: Math.max(1, r._count.members),
        taskCount: r._count.seatTasks,
        unreadCount: unreadCounts[idx] || 0,
        createdAt: r.createdAt.toISOString(),
        eventDate: r.eventDate
          ? r.eventDate.toISOString()
          : "วันแสดงที่กำหนด",
        hasQueue: Boolean(r.hasQueue),
        queueTime: r.queueTime || null,
      };
    });

    return NextResponse.json({ rooms: formattedRooms });
  } catch (error) {
    console.error("[GET /api/rooms error]:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลห้องได้" }, { status: 500 });
  }
}

// POST /api/rooms - สร้างห้องใหม่ลงฐานข้อมูล PostgreSQL จริง
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      eventDate,
      hasQueue,
      queueTime,
      bannerUrl,
      seatingPlanUrl,
      ticketUrl,
      description,
      createdById,
      invitedUserIds,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่องานคอนเสิร์ต" }, { status: 400 });
    }

    const ownerId = createdById?.trim();
    if (!ownerId) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนสร้างห้อง" },
        { status: 401 }
      );
    }

    // Process Poster (Cloudinary upload if base64, else raw URL or null)
    let finalBannerUrl: string | null = null;
    if (bannerUrl && typeof bannerUrl === "string") {
      if (bannerUrl.startsWith("data:image/")) {
        finalBannerUrl = await uploadRoomPoster(bannerUrl, ownerId);
      } else if (bannerUrl.trim()) {
        finalBannerUrl = bannerUrl.trim();
      }
    }

    // Process Seating Plan (Cloudinary upload if base64, else raw URL or null)
    let finalSeatingPlanUrl: string | null = null;
    if (seatingPlanUrl && typeof seatingPlanUrl === "string") {
      if (seatingPlanUrl.startsWith("data:image/")) {
        finalSeatingPlanUrl = await uploadRoomSeatingPlan(seatingPlanUrl, ownerId);
      } else if (seatingPlanUrl.trim()) {
        finalSeatingPlanUrl = seatingPlanUrl.trim();
      }
    }

    // Process optional Ticket / Official Website URL
    let finalTicketUrl: string | null = null;
    if (ticketUrl && typeof ticketUrl === "string" && ticketUrl.trim()) {
      finalTicketUrl = ticketUrl.trim();
    }

    // Process optional Room Note / Description
    let finalDescription: string | null = null;
    if (description && typeof description === "string" && description.trim()) {
      finalDescription = description.trim();
    }

    // Parse Event Date (guarantees Asia/Bangkok time interpretation)
    const parsedEventDate: Date | null = eventDate ? parseDateInBangkok(eventDate) : null;

    const ownerUser = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, name: true, avatarUrl: true },
    });
    const ownerName = ownerUser?.name || "Organizer";

    // Prepare invitations list
    const validInviteeIds: string[] = Array.isArray(invitedUserIds)
      ? invitedUserIds.filter((id) => typeof id === "string" && id !== ownerId)
      : [];

    const initialMessages = [
      {
        userId: ownerId,
        text: `${ownerName} สร้างห้องกดบัตรแล้ว`,
      },
    ];

    if (validInviteeIds.length > 0) {
      const invitedUsers = await prisma.user.findMany({
        where: { id: { in: validInviteeIds } },
        select: { name: true },
      });
      const inviteeNames = invitedUsers.map((u) => u.name).filter(Boolean);
      if (inviteeNames.length > 0) {
        initialMessages.push({
          userId: ownerId,
          text: `${ownerName} ได้เชิญ ${inviteeNames.join(", ")} เข้าร่วมห้อง`,
        });
      }
    }

    const newRoom = await prisma.room.create({
      data: {
        title: title.trim(),
        createdById: ownerId,
        bannerUrl: finalBannerUrl,
        seatingPlanUrl: finalSeatingPlanUrl,
        ticketUrl: finalTicketUrl,
        description: finalDescription,
        eventDate: parsedEventDate,
        hasQueue: Boolean(hasQueue),
        queueTime: hasQueue && queueTime && typeof queueTime === "string" && queueTime.trim() ? queueTime.trim() : null,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
        messages: {
          create: initialMessages,
        },
        ...(validInviteeIds.length > 0
          ? {
              invitations: {
                create: validInviteeIds.map((inviteeId) => ({
                  inviterId: ownerId,
                  inviteeId,
                  status: "PENDING",
                })),
              },
            }
          : {}),
      },
      include: {
        invitations: {
          include: {
            invitee: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const formattedInvitations = newRoom.invitations.map((inv) => ({
      id: inv.id,
      roomId: newRoom.id,
      roomTitle: newRoom.title,
      roomBannerUrl: newRoom.bannerUrl,
      roomEventDate: newRoom.eventDate ? newRoom.eventDate.toISOString() : null,
      inviteCode: newRoom.inviteCode,
      inviterId: ownerId,
      inviterName: ownerName,
      inviterAvatarUrl: ownerUser?.avatarUrl || null,
      inviteeId: inv.inviteeId,
      inviteeName: inv.invitee.name,
      inviteeEmail: inv.invitee.email,
      inviteeAvatarUrl: inv.invitee.avatarUrl,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
    }));

    return NextResponse.json(
      {
        message: "สร้างห้องสำเร็จ",
        room: {
          id: newRoom.id,
          title: newRoom.title,
          inviteCode: newRoom.inviteCode,
          status: newRoom.status,
          createdById: newRoom.createdById,
          role: "OWNER",
          bannerUrl: newRoom.bannerUrl || null,
          seatingPlanUrl: newRoom.seatingPlanUrl || null,
          ticketUrl: newRoom.ticketUrl || null,
          description: newRoom.description || null,
          hasQueue: newRoom.hasQueue,
          queueTime: newRoom.queueTime,
          memberCount: 1,
          createdAt: newRoom.createdAt.toISOString(),
          eventDate: newRoom.eventDate
            ? newRoom.eventDate.toISOString()
            : "เร็วๆ นี้",
        },
        invitations: formattedInvitations,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/rooms error]:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้างห้องได้" }, { status: 500 });
  }
}

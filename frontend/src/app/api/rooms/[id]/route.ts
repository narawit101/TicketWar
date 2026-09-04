import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadRoomPoster, uploadRoomSeatingPlan } from "@/lib/cloudinary";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || req.headers.get("x-user-id");

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        seatTasks: {
          include: {
            lastUpdatedBy: {
              select: { name: true },
            },
          },
          orderBy: { lastUpdatedAt: "desc" },
        },
        messages: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องนี้ในระบบ" }, { status: 404 });
    }

    // Access control: verify user is owner or active member
    if (userId) {
      const isMember =
        room.createdById === userId ||
        room.members.some((m) => m.userId === userId);

      if (!isMember) {
        return NextResponse.json(
          {
            error: "คุณไม่ได้เป็นสมาชิกในห้องนี้ หรือถูกนำออกจากห้องแล้ว",
            notMember: true,
          },
          { status: 403 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedTasks = room.seatTasks.map((t: any) => ({
      id: t.id,
      roomId: t.roomId,
      targetLocation: t.targetLocation,
      targetDate: t.targetDate.toISOString().split("T")[0],
      price: t.price,
      quantityNeeded: t.quantityNeeded,
      quantitySecured: t.quantitySecured,
      note: t.note || "",
      status: t.status,
      securedBy: (t.securedBy as Array<{ userId: string; name: string; qty: number; at: string }>) || [],
      lastUpdatedBy: t.lastUpdatedBy?.name || "Member",
      lastUpdatedAt: t.lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedMessages = room.messages.map((m: any) => ({
      id: m.id,
      roomId: m.roomId,
      userId: m.userId,
      userName: m.user.name,
      userAvatar: m.user.avatarUrl || undefined,
      text: m.text || "",
      imageUrl: m.imageUrl || undefined,
      isShoutout:
        m.text?.includes("เข้ามาแล้ว") ||
        m.text?.includes("ออกจากห้อง") ||
        m.text?.includes("ออกจากแชท") ||
        m.text?.includes("สร้างห้อง") ||
        m.text?.includes("อัปเดตข้อมูลห้อง") ||
        m.text?.includes("เพิ่มที่นั่ง") ||
        m.text?.includes("แก้ไขที่นั่ง") ||
        m.text?.includes("ลบที่นั่ง") ||
        m.text?.includes("ได้ +1 ใบ") ||
        m.text?.includes("ครบแล้ว!") ||
        m.text?.includes("ยกเลิก ") ||
        m.text?.includes("กดได้") ||
        m.text?.includes("ลด/ยกเลิก"),
      createdAt: m.createdAt.toISOString(),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedMembers = room.members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    }));

    return NextResponse.json({
      room: {
        id: room.id,
        title: room.title,
        inviteCode: room.inviteCode,
        status: room.status,
        createdById: room.createdById,
        bannerUrl: room.bannerUrl || null,
        seatingPlanUrl: room.seatingPlanUrl || null,
        ticketUrl: room.ticketUrl || null,
        description: room.description || null,
        memberCount: room.members.length,
        eventDate: room.eventDate
          ? room.eventDate.toISOString()
          : "วันแสดงที่กำหนด",
        members: formattedMembers,
      },
      members: formattedMembers,
      tasks: formattedTasks,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("[GET /api/rooms/[id] error]:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status, title, eventDate, bannerUrl, seatingPlanUrl, ticketUrl, description } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (title !== undefined && typeof title === "string" && title.trim()) {
      updateData.title = title.trim();
    }

    if (bannerUrl !== undefined) {
      if (bannerUrl && typeof bannerUrl === "string" && bannerUrl.startsWith("data:image/")) {
        updateData.bannerUrl = await uploadRoomPoster(bannerUrl, id);
      } else if (bannerUrl && typeof bannerUrl === "string" && bannerUrl.trim()) {
        updateData.bannerUrl = bannerUrl.trim();
      } else {
        updateData.bannerUrl = null;
      }
    }

    if (seatingPlanUrl !== undefined) {
      if (seatingPlanUrl && typeof seatingPlanUrl === "string" && seatingPlanUrl.startsWith("data:image/")) {
        updateData.seatingPlanUrl = await uploadRoomSeatingPlan(seatingPlanUrl, id);
      } else if (seatingPlanUrl && typeof seatingPlanUrl === "string" && seatingPlanUrl.trim()) {
        updateData.seatingPlanUrl = seatingPlanUrl.trim();
      } else {
        updateData.seatingPlanUrl = null;
      }
    }

    if (eventDate !== undefined) {
      if (eventDate) {
        const d = new Date(eventDate);
        updateData.eventDate = !isNaN(d.getTime()) ? d : null;
      } else {
        updateData.eventDate = null;
      }
    }

    if (ticketUrl !== undefined) {
      if (ticketUrl && typeof ticketUrl === "string" && ticketUrl.trim()) {
        updateData.ticketUrl = ticketUrl.trim();
      } else {
        updateData.ticketUrl = null;
      }
    }

    if (description !== undefined) {
      if (description && typeof description === "string" && description.trim()) {
        updateData.description = description.trim();
      } else {
        updateData.description = null;
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      room: {
        ...updated,
        eventDate: updated.eventDate ? updated.eventDate.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/rooms/[id] error]:", error);
    return NextResponse.json({ error: "ไม่สามารถอัปเดตข้อมูลห้องได้" }, { status: 500 });
  }
}

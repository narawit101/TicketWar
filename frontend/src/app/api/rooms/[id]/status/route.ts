import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;
    const body = await req.json();
    const { status, userId } = body;

    if (!roomId) {
      return NextResponse.json({ error: "ไม่พบรหัสห้อง" }, { status: 400 });
    }

    if (!status || !["ACTIVE", "ARCHIVED", "DELETED"].includes(status)) {
      return NextResponse.json({ error: "สถานะห้องไม่ถูกต้อง" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 401 });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        createdById: true,
        status: true,
        bannerUrl: true,
        seatingPlanUrl: true,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "ไม่พบห้องนี้ในระบบ" }, { status: 404 });
    }

    if (room.createdById !== userId) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการจัดการสถานะห้องนี้ (เฉพาะเจ้าของห้องเท่านั้น)" },
        { status: 403 }
      );
    }

    if (status === "DELETED") {
      if (room.bannerUrl) await deleteCloudinaryImage(room.bannerUrl);
      if (room.seatingPlanUrl) await deleteCloudinaryImage(room.seatingPlanUrl);
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: { status },
      select: {
        id: true,
        status: true,
      },
    });

    const statusLabels: Record<string, string> = {
      ACTIVE: "เปิดใช้งานห้องแล้ว",
      ARCHIVED: "เก็บห้องเข้าประวัติเรียบร้อยแล้ว",
      DELETED: "ลบห้องเรียบร้อยแล้ว",
    };

    return NextResponse.json({
      message: statusLabels[status] || "อัปเดตสถานะห้องสำเร็จ",
      room: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/rooms/[id]/status error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการปรับปรุงสถานะห้อง" },
      { status: 500 }
    );
  }
}

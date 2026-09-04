import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json();
    const {
      targetLocation,
      targetDate,
      price,
      quantityNeeded,
      quantitySecured,
      note,
      status,
      lastUpdatedById,
    } = body;

    const task = await prisma.seatTask.create({
      data: {
        roomId,
        targetLocation: targetLocation || "VIP Zone",
        targetDate: targetDate ? new Date(targetDate) : new Date(),
        price: Number(price) || 0,
        quantityNeeded: Number(quantityNeeded) || 1,
        quantitySecured: Number(quantitySecured) || 0,
        note: note || "",
        status: status || "AVAILABLE",
        lastUpdatedById: lastUpdatedById || null,
        securedBy: [],
      },
      include: {
        lastUpdatedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({
      task: {
        id: task.id,
        roomId: task.roomId,
        targetLocation: task.targetLocation,
        targetDate: task.targetDate.toISOString().split("T")[0],
        price: task.price,
        quantityNeeded: task.quantityNeeded,
        quantitySecured: task.quantitySecured,
        note: task.note,
        status: task.status,
        securedBy: [],
        lastUpdatedBy: task.lastUpdatedBy?.name || "Member",
        lastUpdatedAt: "เมื่อสักครู่",
      },
    });
  } catch (error) {
    console.error("[POST /api/rooms/[id]/tasks error]:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้าง Task ได้" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await context.params;
    const body = await req.json();
    const {
      taskId,
      status,
      quantitySecured,
      securedBy,
      lastUpdatedById,
      targetLocation,
      targetDate,
      price,
      quantityNeeded,
      note,
    } = body;

    let parsedDate: Date | undefined = undefined;
    if (targetDate) {
      const d = new Date(targetDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    const updated = await prisma.seatTask.update({
      where: { id: taskId },
      data: {
        ...(status && { status }),
        ...(quantitySecured !== undefined && { quantitySecured }),
        ...(securedBy && { securedBy }),
        ...(lastUpdatedById && { lastUpdatedById }),
        ...(targetLocation && { targetLocation }),
        ...(parsedDate && { targetDate: parsedDate }),
        ...(price !== undefined && { price }),
        ...(quantityNeeded !== undefined && { quantityNeeded }),
        ...(note !== undefined && { note: note?.trim() || null }),
        lastUpdatedAt: new Date(),
      },
      include: {
        lastUpdatedBy: { select: { name: true } },
      },
    });

    return NextResponse.json({
      task: {
        id: updated.id,
        roomId: updated.roomId,
        targetLocation: updated.targetLocation,
        targetDate: updated.targetDate.toISOString().split("T")[0],
        price: updated.price,
        quantityNeeded: updated.quantityNeeded,
        quantitySecured: updated.quantitySecured,
        note: updated.note,
        status: updated.status,
        securedBy: updated.securedBy,
        lastUpdatedBy: updated.lastUpdatedBy?.name || "Member",
        lastUpdatedAt: "เมื่อสักครู่",
      },
    });
  } catch (error) {
    console.error("[PATCH /api/rooms/[id]/tasks error]:", error);
    return NextResponse.json({ error: "ไม่สามารถอัปเดต Task ได้" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await context.params;
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "กรุณาระบุ taskId" }, { status: 400 });
    }

    await prisma.seatTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/rooms/[id]/tasks error]:", error);
    return NextResponse.json({ error: "ไม่สามารถลบ Task ได้" }, { status: 500 });
  }
}

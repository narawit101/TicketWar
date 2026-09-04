import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateInBangkok } from "@/lib/date";

interface SecuredItem {
  userId?: string;
  name?: string;
  isAssignee?: boolean;
  qty?: number;
  at?: string;
  zoneName?: string;
  [key: string]: unknown;
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await context.params;
    const body = await req.json();
    const {
      targetLocation,
      backupLocation,
      targetDate,
      price,
      backupPrice,
      quantityNeeded,
      quantitySecured,
      note,
      status,
      lastUpdatedById,
      pendingPayments,
      securedBy,
    } = body;

    const task = await prisma.seatTask.create({
      data: {
        roomId,
        targetLocation: targetLocation || "VIP Zone",
        backupLocation: backupLocation ? backupLocation.trim() : null,
        targetDate: targetDate ? (parseDateInBangkok(targetDate) || new Date()) : new Date(),
        price: Number(price) || 0,
        backupPrice: backupPrice !== undefined && backupPrice !== "" && backupPrice !== null ? Number(backupPrice) : null,
        quantityNeeded: Number(quantityNeeded) || 1,
        quantitySecured: Number(quantitySecured) || 0,
        note: note || "",
        status: status || "AVAILABLE",
        lastUpdatedById: lastUpdatedById || null,
        securedBy: securedBy || [],
        pendingPayments: pendingPayments || [],
      },
      include: {
        lastUpdatedBy: { select: { name: true } },
      },
    });

    const rawSecured = (task.securedBy as unknown as SecuredItem[]) || [];
    const assigneeRecords = rawSecured.filter((s) => Boolean(s.isAssignee));
    const assignees = assigneeRecords.map((s) => ({
      userId: s.userId || "",
      name: s.name || "",
    }));

    return NextResponse.json({
      task: {
        id: task.id,
        roomId: task.roomId,
        targetLocation: task.targetLocation,
        backupLocation: task.backupLocation,
        targetDate: task.targetDate.toISOString().split("T")[0],
        price: task.price,
        backupPrice: task.backupPrice,
        quantityNeeded: task.quantityNeeded,
        quantitySecured: task.quantitySecured,
        note: task.note,
        status: task.status,
        securedBy: rawSecured.filter((s) => !s.isAssignee),
        assignees,
        assignee: assignees[0] || null,
        pendingPayments: (task.pendingPayments as Array<Record<string, unknown>>) || [],
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
      pendingPayments,
      lastUpdatedById,
      targetLocation,
      backupLocation,
      targetDate,
      price,
      backupPrice,
      quantityNeeded,
      note,
    } = body;

    let parsedDate: Date | undefined = undefined;
    if (targetDate) {
      const d = parseDateInBangkok(targetDate);
      if (d) {
        parsedDate = d;
      }
    }

    const updated = await prisma.seatTask.update({
      where: { id: taskId },
      data: {
        ...(status && { status }),
        ...(quantitySecured !== undefined && { quantitySecured }),
        ...(securedBy !== undefined && { securedBy }),
        ...(pendingPayments !== undefined && { pendingPayments }),
        ...(lastUpdatedById
          ? { lastUpdatedBy: { connect: { id: lastUpdatedById } } }
          : {}),
        ...(targetLocation && { targetLocation }),
        ...(backupLocation !== undefined && { backupLocation: backupLocation?.trim() || null }),
        ...(parsedDate && { targetDate: parsedDate }),
        ...(price !== undefined && { price: Number(price) || 0 }),
        ...(backupPrice !== undefined && {
          backupPrice: backupPrice !== "" && backupPrice !== null ? Number(backupPrice) : null,
        }),
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
        backupLocation: updated.backupLocation,
        targetDate: updated.targetDate.toISOString().split("T")[0],
        price: updated.price,
        backupPrice: updated.backupPrice,
        quantityNeeded: updated.quantityNeeded,
        quantitySecured: updated.quantitySecured,
        note: updated.note,
        status: updated.status,
        securedBy: updated.securedBy,
        pendingPayments: (updated.pendingPayments as Array<Record<string, unknown>>) || [],
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
      return NextResponse.json({ error: "ต้องระบุ taskId" }, { status: 400 });
    }

    await prisma.seatTask.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    console.error("[DELETE /api/rooms/[id]/tasks error]:", error);
    return NextResponse.json({ error: "ไม่สามารถลบ Task ได้" }, { status: 500 });
  }
}

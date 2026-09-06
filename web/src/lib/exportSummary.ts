import { Room, SeatTask, SecuredByRecord, PendingPaymentRecord } from "@/types";
import { formatThaiDate } from "@/lib/date";
import { toast } from "react-hot-toast";

export interface MemberSummary {
  userId: string;
  name: string;
  securedQty: number;
  pendingQty: number;
  totalSecuredCost: number;
  totalPendingCost: number;
  totalCost: number;
  zones: string[];
}

export interface RoomSummaryData {
  totalNeeded: number;
  totalSecured: number;
  totalPending: number;
  securedPercent: number;
  totalSecuredAmount: number;
  totalPendingAmount: number;
  totalAmount: number;
  members: MemberSummary[];
  taskItems: {
    taskId: string;
    targetLocation: string;
    targetDate: string;
    needed: number;
    secured: number;
    pending: number;
    price: number;
    subtotalSecured: number;
    subtotalPending: number;
    securedHolders: SecuredByRecord[];
    pendingHolders: PendingPaymentRecord[];
    note?: string;
  }[];
}

/**
 * Calculates comprehensive war room statistics from seat tasks.
 */
export function calculateRoomSummary(tasks: SeatTask[]): RoomSummaryData {
  let totalNeeded = 0;
  let totalSecured = 0;
  let totalPending = 0;
  let totalSecuredAmount = 0;
  let totalPendingAmount = 0;

  const memberMap = new Map<string, MemberSummary>();

  const getOrCreateMember = (userId: string, name: string): MemberSummary => {
    const key = userId || name;
    if (!memberMap.has(key)) {
      memberMap.set(key, {
        userId: userId || "",
        name: name || "ไม่ระบุชื่อ",
        securedQty: 0,
        pendingQty: 0,
        totalSecuredCost: 0,
        totalPendingCost: 0,
        totalCost: 0,
        zones: [],
      });
    }
    return memberMap.get(key)!;
  };

  const taskItems = tasks.map((task) => {
    totalNeeded += task.quantityNeeded;
    totalSecured += task.quantitySecured;

    const securedHolders = task.securedBy || [];
    const pendingHolders = task.pendingPayments || [];

    const taskPendingQty = pendingHolders.length;
    totalPending += taskPendingQty;

    // Secured cost
    let taskSecuredCost = 0;
    securedHolders.forEach((holder) => {
      const qty = holder.qty || 1;
      const isBackup = holder.zoneType === "BACKUP";
      const unitPrice =
        isBackup && task.backupPrice != null ? task.backupPrice : task.price;
      const holderCost = unitPrice * qty;
      taskSecuredCost += holderCost;

      const member = getOrCreateMember(holder.userId, holder.name);
      member.securedQty += qty;
      member.totalSecuredCost += holderCost;
      member.totalCost += holderCost;
      const zoneLabel = holder.zoneName || task.targetLocation;
      if (!member.zones.includes(zoneLabel)) {
        member.zones.push(zoneLabel);
      }
    });

    totalSecuredAmount += taskSecuredCost;

    // Pending payments cost
    let taskPendingCost = 0;
    pendingHolders.forEach((pending) => {
      const unitPrice = pending.price || task.price;
      taskPendingCost += unitPrice;

      const member = getOrCreateMember(pending.userId, pending.name);
      member.pendingQty += 1;
      member.totalPendingCost += unitPrice;
      member.totalCost += unitPrice;
      const zoneLabel = pending.zoneName || task.targetLocation;
      if (!member.zones.includes(zoneLabel)) {
        member.zones.push(zoneLabel);
      }
    });

    totalPendingAmount += taskPendingCost;

    return {
      taskId: task.id,
      targetLocation: task.targetLocation,
      targetDate: task.targetDate,
      needed: task.quantityNeeded,
      secured: task.quantitySecured,
      pending: taskPendingQty,
      price: task.price,
      subtotalSecured: taskSecuredCost,
      subtotalPending: taskPendingCost,
      securedHolders,
      pendingHolders,
      note: task.note,
    };
  });

  const securedPercent =
    totalNeeded > 0 ? Math.min(100, Math.round((totalSecured / totalNeeded) * 100)) : 0;

  const totalAmount = totalSecuredAmount + totalPendingAmount;
  const members = Array.from(memberMap.values()).sort(
    (a, b) => b.totalCost - a.totalCost || b.securedQty - a.securedQty,
  );

  return {
    totalNeeded,
    totalSecured,
    totalPending,
    securedPercent,
    totalSecuredAmount,
    totalPendingAmount,
    totalAmount,
    members,
    taskItems,
  };
}

/**
 * Escapes fields for CSV compliance.
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports summary data to CSV format with UTF-8 BOM (\uFEFF)
 * for native, garble-free viewing in Microsoft Excel, Google Sheets, and Numbers.
 */
export function exportSummaryToCSV(room: Room, tasks: SeatTask[]) {
  const summary = calculateRoomSummary(tasks);

  const lines: string[] = [];

  // Header Title
  lines.push(`${escapeCSV("สรุปผล - TicketWar")}`);
  lines.push(`${escapeCSV("ชื่องาน:")},${escapeCSV(room.title)}`);
  lines.push(
    `${escapeCSV("วันที่กดบัตร/แสดง:")},${escapeCSV(
      room.eventDate ? formatThaiDate(room.eventDate) : "ไม่ระบุ",
    )}`,
  );
  lines.push(
    `${escapeCSV("วันที่สร้างรายงาน:")},${escapeCSV(
      new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
    )}`,
  );
  lines.push(""); // empty row

  // Table 1: รายการบัตรและโซนเป้าหมาย
  lines.push(`${escapeCSV("=== รายการเป้าหมายและบัตรที่ได้ ===")}`);
  lines.push(
    [
      escapeCSV("รอบการแสดง"),
      escapeCSV("โซนเป้าหมาย"),
      escapeCSV("โซนสำรอง"),
      escapeCSV("ราคาหลัก (บาท)"),
      escapeCSV("ราคาสำรอง (บาท)"),
      escapeCSV("ต้องการ (ใบ)"),
      escapeCSV("ได้แล้ว (ใบ)"),
      escapeCSV("รอจ่าย (ใบ)"),
      escapeCSV("ยอดเงินที่ได้แล้ว (บาท)"),
      escapeCSV("ยอดรอจ่าย (บาท)"),
      escapeCSV("คนกด (Secured By)"),
      escapeCSV("ผู้รอจ่ายเงิน (Pending)"),
      escapeCSV("หมายเหตุ"),
    ].join(","),
  );

  tasks.forEach((task) => {
    const item = summary.taskItems.find((t) => t.taskId === task.id);
    const dateFormatted = formatThaiDate(task.targetDate);
    const securedNames =
      task.securedBy && task.securedBy.length > 0
        ? task.securedBy
          .map(
            (s) =>
              `${s.name} (${s.qty || 1} ใบ${s.zoneName ? ` - ${s.zoneName}` : ""
              })`,
          )
          .join("; ")
        : "-";

    const pendingNames =
      task.pendingPayments && task.pendingPayments.length > 0
        ? task.pendingPayments
          .map((p) => `${p.name} (${p.zoneName || "รอจ่าย"})`)
          .join("; ")
        : "-";

    lines.push(
      [
        escapeCSV(dateFormatted),
        escapeCSV(task.targetLocation),
        escapeCSV(task.backupLocation || "-"),
        escapeCSV(task.price),
        escapeCSV(task.backupPrice || "-"),
        escapeCSV(task.quantityNeeded),
        escapeCSV(task.quantitySecured),
        escapeCSV(item?.pending || 0),
        escapeCSV(item?.subtotalSecured || 0),
        escapeCSV(item?.subtotalPending || 0),
        escapeCSV(securedNames),
        escapeCSV(pendingNames),
        escapeCSV(task.note || "-"),
      ].join(","),
    );
  });

  lines.push(""); // empty row

  // Table 2: สรุปแยกตามรายบุคคล
  lines.push(`${escapeCSV("=== สรุปยอดแยกตามรายคน (ผู้กดบัตร) ===")}`);
  lines.push(
    [
      escapeCSV("ชื่อผู้กด"),
      escapeCSV("จำนวนที่ได้สำเร็จ (ใบ)"),
      escapeCSV("จำนวนรอจ่าย (ใบ)"),
      escapeCSV("ยอดเงินสำเร็จ (บาท)"),
      escapeCSV("ยอดเงินรอจ่าย (บาท)"),
      escapeCSV("ยอดเงินรวม (บาท)"),
      escapeCSV("โซนที่กดได้"),
    ].join(","),
  );

  summary.members.forEach((m) => {
    lines.push(
      [
        escapeCSV(m.name),
        escapeCSV(m.securedQty),
        escapeCSV(m.pendingQty),
        escapeCSV(m.totalSecuredCost),
        escapeCSV(m.totalPendingCost),
        escapeCSV(m.totalCost),
        escapeCSV(m.zones.join(", ") || "-"),
      ].join(","),
    );
  });

  lines.push(""); // empty row

  // Table 3: ยอดรวมทั้งสิ้น (Grand Summary)
  lines.push(`${escapeCSV("=== ยอดรวมทั้งสิ้น ===")}`);
  lines.push(`${escapeCSV("บัตรที่ต้องการทั้งหมด:")},${escapeCSV(summary.totalNeeded)}`);
  lines.push(
    `${escapeCSV("บัตรที่ได้สำเร็จ:")},${escapeCSV(summary.totalSecured)},${escapeCSV(
      `(${summary.securedPercent}%)`,
    )}`,
  );
  lines.push(`${escapeCSV("บัตรที่รอจ่ายเงิน:")},${escapeCSV(summary.totalPending)}`);
  lines.push(
    `${escapeCSV("ยอดเงินรวม (บาท):")},${escapeCSV(summary.totalSecuredAmount)}`,
  );
  lines.push(
    `${escapeCSV("ยอดเงินรอจ่ายรวม (บาท):")},${escapeCSV(summary.totalPendingAmount)}`,
  );
  lines.push(
    `${escapeCSV("ยอดเงินรวมทั้งสิ้น (บาท):")},${escapeCSV(summary.totalAmount)}`,
  );

  // Prepend UTF-8 BOM (\uFEFF) to guarantee Excel correctly identifies encoding as UTF-8
  const csvContent = "\uFEFF" + lines.join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const sanitizedTitle = room.title.replace(/[^a-zA-Z0-9ก-๙_-]/g, "_").slice(0, 30);
  const dateStamp = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `TicketWar_สรุป_${sanitizedTitle}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success("ดาวน์โหลดไฟล์ Excel (CSV) เรียบร้อยแล้ว!");
}

/**
 * Generates formatted text summary optimized for sharing in LINE / Chat.
 */
export function generateSummaryText(room: Room, tasks: SeatTask[]): string {
  const summary = calculateRoomSummary(tasks);
  const dateFormatted = room.eventDate ? formatThaiDate(room.eventDate) : "ไม่ระบุ";

  let text = `🎟️ สรุปผล: ${room.title}\n`;
  text += `📅 วันที่: ${dateFormatted}\n`;
  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `🎯 ได้บัตรแล้ว: ${summary.totalSecured}/${summary.totalNeeded} ใบ (${summary.securedPercent}%)\n`;
  text += `💰 ยอดเงินสำเร็จ: ฿${summary.totalSecuredAmount.toLocaleString()}\n`;
  if (summary.totalPending > 0) {
    text += `⏳ รอจ่ายเงิน: ${summary.totalPending} ใบ (฿${summary.totalPendingAmount.toLocaleString()})\n`;
    text += `💵 ยอดรวมทั้งสิ้น: ฿${summary.totalAmount.toLocaleString()}\n`;
  }
  text += `━━━━━━━━━━━━━━━━━━\n`;

  text += `📋 รายการบัตรที่ได้:\n`;
  let hasSecured = false;
  tasks.forEach((task) => {
    if (task.securedBy && task.securedBy.length > 0) {
      hasSecured = true;
      task.securedBy.forEach((s) => {
        const zone = s.zoneName || task.targetLocation;
        const isBackup = s.zoneType === "BACKUP";
        const price =
          isBackup && task.backupPrice != null ? task.backupPrice : task.price;
        text += `• ${zone} x ${s.qty || 1} (฿${(price * (s.qty || 1)).toLocaleString()}) ➔ ${s.name}\n`;
      });
    }
  });

  if (!hasSecured) {
    text += `(ยังไม่มีรายการที่ได้สำเร็จ)\n`;
  }

  if (summary.totalPending > 0) {
    text += `\n⏳ รายการรอจ่ายเงิน:\n`;
    tasks.forEach((task) => {
      if (task.pendingPayments && task.pendingPayments.length > 0) {
        task.pendingPayments.forEach((p) => {
          text += `• ${p.zoneName || task.targetLocation} (฿${(p.price || task.price).toLocaleString()}) ➔ ${p.name}\n`;
        });
      }
    });
  }

  if (summary.members.length > 0) {
    text += `━━━━━━━━━━━━━━━━━━\n`;
    text += `👥 สรุปยอดรายคน:\n`;
    summary.members.forEach((m) => {
      const pendingPart = m.pendingQty > 0 ? ` [รอจ่าย ${m.pendingQty} ใบ]` : "";
      text += `• ${m.name}: ได้ ${m.securedQty} ใบ${pendingPart} ➔ ยอดรวม ฿${m.totalCost.toLocaleString()}\n`;
    });
  }

  text += `━━━━━━━━━━━━━━━━━━\n`;
  text += `TicketWar ⚔️`;

  return text;
}

/**
 * Copies the formatted summary to clipboard with user feedback.
 */
export async function copySummaryToClipboard(room: Room, tasks: SeatTask[]): Promise<boolean> {
  try {
    const text = generateSummaryText(room, tasks);
    await navigator.clipboard.writeText(text);
    toast.success("คัดลอกข้อความสรุปสำหรับ LINE เรียบร้อยแล้ว!");
    return true;
  } catch (err) {
    console.error("Failed to copy summary to clipboard:", err);
    toast.error("ไม่สามารถคัดลอกข้อความได้");
    return false;
  }
}

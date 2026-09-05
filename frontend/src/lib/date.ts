/**
 * Thai Date Utilities - formats dates to Thai Buddhist Era (พ.ศ.) in Asia/Bangkok timezone
 */

export const THAI_MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

export const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

interface FormatOptions {
  includeTime?: boolean;
  format?: "short" | "full";
}

/**
 * Formats an ISO string, YYYY-MM-DD, or Date object into a readable Thai date (พ.ศ.)
 * Always formats in Asia/Bangkok timezone to prevent server (UTC) vs client (UTC+7) shifts.
 * Examples:
 *   formatThaiDate("2026-10-24") -> "24 ต.ค. 2569"
 *   formatThaiDate("2026-10-24", { format: "full" }) -> "24 ตุลาคม 2569"
 *   formatThaiDate("2026-10-24T18:00:00", { includeTime: true }) -> "24 ต.ค. 2569 18:00 น."
 */
export function formatThaiDate(
  dateInput?: string | Date | null,
  options: FormatOptions = {}
): string {
  if (!dateInput) return "ยังไม่ระบุวัน";
  if (dateInput === "วันแสดงที่กำหนด" || dateInput === "เร็วๆ นี้") {
    return dateInput;
  }

  try {
    // If it's a simple YYYY-MM-DD string without time, parse parts directly
    if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [yearStr, monthStr, dayStr] = dateInput.split("-");
      const year = parseInt(yearStr, 10) + 543;
      const monthIdx = parseInt(monthStr, 10) - 1;
      const day = parseInt(dayStr, 10);

      const monthName =
        options.format === "full"
          ? THAI_MONTHS_FULL[monthIdx] || ""
          : THAI_MONTHS_SHORT[monthIdx] || "";

      return `${day} ${monthName} ${year}`;
    }

    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      // If it cannot be parsed as a date, return original string
      return String(dateInput);
    }

    // Always extract date parts in Asia/Bangkok timezone
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hourCycle: "h23",
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    const day = parseInt(map.day || "1", 10);
    const monthIdx = parseInt(map.month || "1", 10) - 1;
    const year = parseInt(map.year || "2026", 10) + 543;
    const monthName =
      options.format === "full"
        ? THAI_MONTHS_FULL[monthIdx] || ""
        : THAI_MONTHS_SHORT[monthIdx] || "";

    if (options.includeTime) {
      const hours = (map.hour || "00").padStart(2, "0");
      const minutes = (map.minute || "00").padStart(2, "0");
      return `${day} ${monthName} ${year} ${hours}:${minutes} น.`;
    }

    return `${day} ${monthName} ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formatter for event/booking dates (includes Thai time in Bangkok timezone)
 */
export const formatEventDate = (dateStr?: string | Date | null): string =>
  formatThaiDate(dateStr, { includeTime: true });

/**
 * Normalizes any date string or Date object into YYYY-MM-DD for native HTML <input type="date">
 * in Asia/Bangkok timezone.
 */
export function toInputDateValue(raw?: string | Date | null): string {
  if (!raw) {
    return toInputDateTime(new Date()).split("T")[0];
  }
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  try {
    const d = typeof raw === "string" ? new Date(raw) : raw;
    if (!isNaN(d.getTime())) {
      return toInputDateTime(d).split("T")[0];
    }
  } catch {}
  return String(raw);
}

/**
 * Converts any date or ISO string into YYYY-MM-DDTHH:mm for native HTML <input type="datetime-local">
 * in Asia/Bangkok timezone.
 */
export function toInputDateTime(dateInput?: string | Date | null): string {
  if (!dateInput || dateInput === "วันแสดงที่กำหนด" || dateInput === "เร็วๆ นี้") {
    return "";
  }
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);

    const map: Record<string, string> = {};
    for (const p of parts) {
      map[p.type] = p.value;
    }

    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
  } catch {
    return "";
  }
}

/**
 * Parses a date or datetime string into a valid Date object.
 * If the string has no timezone offset (e.g. from <input type="datetime-local"> like "2026-09-04T19:00"
 * or <input type="date"> like "2026-09-04"), treats it as Asia/Bangkok (+07:00).
 * Prevents UTC servers (Node in Docker/Vercel) from shifting user-selected Thai times.
 */
export function parseDateInBangkok(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  const str = String(input).trim();
  if (!str) return null;

  // YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss without timezone offset
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
    const d = new Date(`${str}+07:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD without time
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const d = new Date(`${str}T00:00:00+07:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

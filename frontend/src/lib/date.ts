/**
 * Thai Date Utilities (Zero-dependency, Ponytail senior implementation)
 * Formats dates to Thai Buddhist Era (พ.ศ.) and provides clean date picker parsing.
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
    // If it's a simple YYYY-MM-DD string, parse parts manually to avoid UTC timezone shifts
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
      // If it cannot be parsed as a date, return the original string (e.g. "รอบการแสดงที่ 1")
      return String(dateInput);
    }

    const day = d.getDate();
    const monthName =
      options.format === "full"
        ? THAI_MONTHS_FULL[d.getMonth()]
        : THAI_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear() + 543;

    if (options.includeTime) {
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day} ${monthName} ${year} ${hours}:${minutes} น.`;
    }

    return `${day} ${monthName} ${year}`;
  } catch {
    return String(dateInput);
  }
}

/**
 * Formatter for event/booking dates (includes Thai time if available)
 */
export const formatEventDate = (dateStr?: string): string =>
  formatThaiDate(dateStr, { includeTime: true });

/**
 * Normalizes any date string into YYYY-MM-DD for native HTML <input type="date">
 */
export function toInputDateValue(raw?: string | null): string {
  if (!raw) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
  } catch {}
  return raw;
}

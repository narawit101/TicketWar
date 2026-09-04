export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return {
      isValid: false,
      error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: "รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: "รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว",
    };
  }
  return { isValid: true };
}

const SYSTEM_SHOUTOUT_REGEX =
  /(?:เข้ามาแล้ว|ออกจากห้อง|ออกจากแชท|สร้างห้อง|อัปเดตข้อมูลห้อง|เพิ่มที่นั่ง|แก้ไขที่นั่ง|ลบที่นั่ง|ได้ \+1 ใบ|ครบแล้ว!|ยกเลิก|กดได้|ลด\/ยกเลิก|เชิญ|ถูกเตะ|ล็อคที่นั่ง|รอจ่ายเงิน|ชำระเงิน)/;

export function isSystemShoutout(text?: string | null): boolean {
  if (!text) return false;
  return SYSTEM_SHOUTOUT_REGEX.test(text);
}

export function parseZoneLocations(
  targetLoc: string,
  backupLoc?: string | null,
): {
  mainLocation: string;
  backupLocation: string;
} {
  if (backupLoc && backupLoc.trim()) {
    return { mainLocation: targetLoc.trim(), backupLocation: backupLoc.trim() };
  }
  if (!targetLoc) {
    return { mainLocation: "", backupLocation: "" };
  }

  // Check newline split first
  const lines = targetLoc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length >= 2) {
    const backupIdx = lines.findIndex((l) => l.includes("สำรอง"));
    if (backupIdx !== -1) {
      const backupLine = lines[backupIdx]
        .replace(/^[⭐*•\s-]*(?:โซน)?สำรอง(?:\s*[:\-–]?\s*)/i, "")
        .trim();
      const mainLines = lines
        .filter((_, idx) => idx !== backupIdx)
        .map((l) =>
          l.replace(/^[⭐*•\s-]*(?:โซน)?หลัก(?:\s*[:\-–]?\s*)/i, "").trim(),
        );
      return {
        mainLocation: mainLines.join(" ") || targetLoc.trim(),
        backupLocation: backupLine,
      };
    }
  }

  // Check inline "สำรอง"
  const inlineMatch = targetLoc.match(
    /(?:^|\s+|[•\-,])(?:โซน)?สำรอง(?:\s*[:\-–]?\s*)(.+)$/i,
  );
  if (inlineMatch) {
    const mainPart = targetLoc.slice(0, inlineMatch.index).trim();
    const backupPart = inlineMatch[1].trim();
    if (mainPart && backupPart) {
      return {
        mainLocation: mainPart
          .replace(/^[⭐*•\s-]*(?:โซน)?หลัก(?:\s*[:\-–]?\s*)/i, "")
          .trim(),
        backupLocation: backupPart.replace(/^[⭐*•\s-]*/, "").trim(),
      };
    }
  }

  return { mainLocation: targetLoc.trim(), backupLocation: "" };
}

export function formatPendingZoneName(
  zoneName: string,
  zoneType?: "MAIN" | "BACKUP",
): string {
  if (!zoneName) return "";
  const { mainLocation, backupLocation } = parseZoneLocations(zoneName);
  if (backupLocation) {
    return zoneType === "BACKUP" ? backupLocation : mainLocation;
  }
  return zoneName.replace(/^[⭐*•\s-]+/, "").trim();
}


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
  /(?:เข้ามาแล้ว|ออกจากห้อง|ออกจากแชท|สร้างห้อง|อัปเดตข้อมูลห้อง|เพิ่มที่นั่ง|แก้ไขที่นั่ง|ลบที่นั่ง|ได้ \+1 ใบ|ครบแล้ว!|ยกเลิก|กดได้|ลด\/ยกเลิก|เชิญ|ถูกเตะ)/;

export function isSystemShoutout(text?: string | null): boolean {
  if (!text) return false;
  return SYSTEM_SHOUTOUT_REGEX.test(text);
}

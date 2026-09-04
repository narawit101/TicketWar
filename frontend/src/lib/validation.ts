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

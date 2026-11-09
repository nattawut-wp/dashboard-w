export const DEFAULT_REDIRECT = "/dashboard";

// path ที่ห้ามพาไปหลัง login: หน้า login เอง (วนไม่จบ) และ API (ไม่ใช่หน้าเว็บ)
const BLOCKED_PREFIXES = ["/login", "/api"];

// ช่องว่างและอักขระควบคุม — เบราว์เซอร์ตัดทิ้งตอนอ่าน URL จนอาจกลายเป็น //เว็บอื่น
const UNSAFE_CHARS = /[\s\x00-\x1f\x7f]/;

/**
 * ตรวจ path ที่จะพาผู้ใช้ไปหลัง login (มาจาก ?next=... ใน URL ซึ่งใครก็แก้ได้)
 * ยอมเฉพาะ path ภายในเว็บเรา ไม่งั้นคนร้ายส่งลิงก์ login ที่พาไปเว็บปลอมได้ (open redirect)
 */
export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !isInternalPath(value)) return DEFAULT_REDIRECT;

  const pathname = value.split(/[?#]/)[0];
  const blocked = BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return blocked ? DEFAULT_REDIRECT : value;
}

function isInternalPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !UNSAFE_CHARS.test(value)
  );
}

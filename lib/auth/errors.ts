/** รูปแบบ error ที่ Better Auth client ส่งกลับมา (ใช้แค่ 2 ช่องนี้) */
export type AuthError = { status?: number; code?: string } | null | undefined;

// ใช้ Map ไม่ใช่ object ธรรมดา: object มี key แฝงอย่าง "toString" ที่จะคืนฟังก์ชันออกมาแทนข้อความ
const MESSAGES_BY_CODE = new Map<string, string>([
  ["INVALID_EMAIL_OR_PASSWORD", "อีเมลหรือรหัสผ่านไม่ถูกต้อง"],
  ["INVALID_EMAIL", "รูปแบบอีเมลไม่ถูกต้อง"],
]);

const TOO_MANY_REQUESTS = "ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่";
const GENERIC = "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

/** แปลง error จากการ login เป็นข้อความภาษาไทยที่แสดงให้ผู้ใช้เห็น */
export function loginErrorMessage(error: AuthError): string {
  if (error?.status === 429) return TOO_MANY_REQUESTS;
  return MESSAGES_BY_CODE.get(error?.code ?? "") ?? GENERIC;
}

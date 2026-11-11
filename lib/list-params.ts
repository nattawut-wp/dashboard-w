// ตัวช่วยอ่านค่าจาก URL ของหน้ารายการ (ออร์เดอร์ / สินค้า) — ใช้ร่วมกัน

export type SearchParams = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 20;
export const MAX_QUERY_LENGTH = 100;

/** คำนวณการแบ่งหน้า — ไม่มีข้อมูลก็ยังมี 1 หน้า, ขอหน้าเกินจะได้หน้าสุดท้าย */
export function paginate(totalItems: number, requestedPage: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return { page, totalPages, skip: (page - 1) * pageSize, take: pageSize };
}

/** ?q=a&q=b → Next ส่งมาเป็น array → ใช้ค่าแรก */
export function firstParam(value: SearchParams[string]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** คำค้นหา: ตัดช่องว่างหน้า-หลัง และยาวไม่เกิน 100 ตัว */
export function parseQuery(value: SearchParams[string]): string {
  return (firstParam(value) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

/** เฉพาะเลขจำนวนเต็มบวกเขียนปกติ (1, 2, 30) — นอกนั้นหน้า 1 */
export function parsePage(value: SearchParams[string]): number {
  const text = firstParam(value);
  if (text === undefined || !/^[1-9]\d*$/.test(text)) return 1;
  const page = Number(text);
  return Number.isSafeInteger(page) ? page : 1;
}

/** สร้างลิงก์ — ไม่ใส่ค่าว่าง ลิงก์จะได้สั้น */
export function buildHref(path: string, params: Record<string, string | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

/** ตัวเลขน้อยกว่านี้ไม่ใช้ค้นเบอร์โทร (ตัวเลขตัวเดียวตรงกับเกือบทุกเบอร์) */
const MIN_PHONE_SEARCH_DIGITS = 3;

/**
 * ตัวเลขจากคำค้นสำหรับค้นเบอร์โทร ("081-234" → "081234") — ตัวเลขน้อยกว่า 3 ตัว → "" (ไม่ค้นเบอร์)
 */
export function phoneSearchDigits(q: string): string {
  const digits = q.replace(/\D/g, "");
  return digits.length >= MIN_PHONE_SEARCH_DIGITS ? digits : "";
}

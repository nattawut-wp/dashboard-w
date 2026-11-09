import { isOrderStatus, type OrderStatus } from "./status";

export type SearchParams = Record<string, string | string[] | undefined>;
export type OrderListParams = { q: string; status: OrderStatus | null; page: number };

const MAX_QUERY_LENGTH = 100;

/**
 * อ่านตัวกรองหน้ารายการออร์เดอร์จาก URL (?q=&status=&page=)
 * URL ใครก็แก้ได้ → ค่าที่ผิดจะถูกแทนด้วยค่าเริ่มต้น ไม่ทำให้หน้าพัง
 */
export function parseOrderListParams(searchParams: SearchParams): OrderListParams {
  const q = (first(searchParams.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH);
  const status = first(searchParams.status);
  return {
    q,
    status: isOrderStatus(status) ? status : null,
    page: parsePage(first(searchParams.page)),
  };
}

/** สร้างลิงก์หน้ารายการ (ใช้กับปุ่มเปลี่ยนหน้า) — ไม่ใส่ค่าที่เป็นค่าเริ่มต้น ลิงก์จะได้สั้น */
export function buildOrderListHref({ q, status, page }: OrderListParams): string {
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (status) query.set("status", status);
  if (page > 1) query.set("page", String(page));
  const text = query.toString();
  return text ? `/orders?${text}` : "/orders";
}

export const PAGE_SIZE = 20;

/** คำนวณการแบ่งหน้า — ไม่มีข้อมูลก็ยังมี 1 หน้า, ขอหน้าเกินจะได้หน้าสุดท้าย */
export function paginate(totalItems: number, requestedPage: number, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  return { page, totalPages, skip: (page - 1) * pageSize, take: pageSize };
}

/** ?q=a&q=b → Next ส่งมาเป็น array → ใช้ค่าแรก */
function first(value: SearchParams[string]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** เฉพาะเลขจำนวนเต็มบวกเขียนปกติ (1, 2, 30) — นอกนั้นหน้า 1 */
function parsePage(value: string | undefined): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

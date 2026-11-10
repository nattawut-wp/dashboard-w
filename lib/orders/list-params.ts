import { buildHref, parsePage, parseQuery, firstParam, type SearchParams } from "@/lib/list-params";
import { isOrderStatus, type OrderStatus } from "./status";

export { paginate, PAGE_SIZE, type SearchParams } from "@/lib/list-params";
export type OrderListParams = { q: string; status: OrderStatus | null; page: number };

/**
 * อ่านตัวกรองหน้ารายการออร์เดอร์จาก URL (?q=&status=&page=)
 * URL ใครก็แก้ได้ → ค่าที่ผิดจะถูกแทนด้วยค่าเริ่มต้น ไม่ทำให้หน้าพัง
 */
export function parseOrderListParams(searchParams: SearchParams): OrderListParams {
  const status = firstParam(searchParams.status);
  return {
    q: parseQuery(searchParams.q),
    status: isOrderStatus(status) ? status : null,
    page: parsePage(searchParams.page),
  };
}

/** สร้างลิงก์หน้ารายการ (ใช้กับปุ่มเปลี่ยนหน้า) — ไม่ใส่ค่าที่เป็นค่าเริ่มต้น ลิงก์จะได้สั้น */
export function buildOrderListHref({ q, status, page }: OrderListParams): string {
  return buildHref("/orders", { q, status, page: page > 1 ? String(page) : null });
}

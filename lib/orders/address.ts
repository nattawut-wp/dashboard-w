import type { OrderStatus } from "./status";

/**
 * ออร์เดอร์ที่ "ต้องส่งของแต่ยังไม่มีที่อยู่" — ชำระแล้วเท่านั้น
 * (รอชำระ: ยังไม่ต้องรีบ / ส่งแล้ว / ยกเลิก: ไม่ต้องส่งแล้ว)
 */
export function needsShippingAddress(status: OrderStatus, shippingAddress: string | null): boolean {
  return status === "PAID" && !shippingAddress?.trim();
}

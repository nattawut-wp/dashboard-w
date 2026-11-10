import type { OrderItemInput } from "./items";
import type { OrderStatus } from "./status";

export type OrderStockState = { status: OrderStatus; items: OrderItemInput[] } | null;
export type StockChange = { productId: number; delta: number };

/** จำนวนที่ออร์เดอร์นี้ "จอง" สต็อกไว้ — ไม่มีออร์เดอร์ / ยกเลิกแล้ว = ไม่จอง */
function reserved(order: OrderStockState): Map<number, number> {
  const map = new Map<number, number>();
  if (!order || order.status === "CANCELLED") return map;
  for (const { productId, quantity } of order.items) {
    map.set(productId, (map.get(productId) ?? 0) + quantity);
  }
  return map;
}

/**
 * สต็อกที่ต้องเปลี่ยนเมื่อออร์เดอร์เปลี่ยนจาก `before` เป็น `after`
 * - สร้าง: before = null / ลบ: after = null
 * - delta ติดลบ = ตัดสต็อก, บวก = คืนสต็อก, ไม่เปลี่ยน = ไม่อยู่ในผล
 * - เรียงตามรหัสสินค้าเสมอ → ทุกการบันทึกล็อกแถวสินค้าในลำดับเดียวกัน (กัน deadlock เมื่อบันทึกพร้อมกัน)
 */
export function stockChanges(before: OrderStockState, after: OrderStockState): StockChange[] {
  const held = reserved(before);
  const needed = reserved(after);
  const ids = new Set([...held.keys(), ...needed.keys()]);
  return [...ids]
    .sort((a, b) => a - b)
    .map((productId) => ({ productId, delta: (held.get(productId) ?? 0) - (needed.get(productId) ?? 0) }))
    .filter((change) => change.delta !== 0);
}

/** ข้อความเมื่อสต็อกไม่พอ (`needed` = จำนวนที่ต้องตัดเพิ่มจากคงเหลือตอนนี้) */
export function shortageMessage(name: string, available: number, needed: number): string {
  if (available <= 0) return `“${name}” หมดแล้ว`;
  const n = (value: number) => value.toLocaleString("th-TH");
  return `“${name}” เหลือ ${n(available)} ชิ้น ไม่พอ (ต้องการ ${n(needed)})`;
}

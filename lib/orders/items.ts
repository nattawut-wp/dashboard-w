import { parseId } from "@/lib/ids";

/** สินค้า 1 แถวในออร์เดอร์ (ยังไม่รู้ชื่อ — ฝั่งเซิร์ฟเวอร์เติมจากฐานข้อมูล) */
export type OrderItemInput = { productId: number; quantity: number };

export type ParseItemsResult = { success: true; items: OrderItemInput[] } | { success: false; error: string };

export const MAX_ITEM_QUANTITY = 10_000;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** "1,200" → 1200 ; ไม่ใช่จำนวนเต็มเขียนปกติ → null */
function wholeNumber(value: unknown): number | null {
  const digits = text(value).replace(/,/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : null;
}

/**
 * อ่านแถวสินค้าจากฟอร์มออร์เดอร์ (FormData.getAll ของ itemProductId / itemQuantity — ลำดับตรงกัน)
 * - แถวที่ยังไม่เลือกสินค้า → ข้าม
 * - สินค้าเดียวกันหลายแถว → รวมจำนวน (เรียงตามแถวแรกที่เจอ)
 * - ข้อความผิดพลาดบอกเลขแถวตามที่เห็นบนหน้าจอ
 */
export function parseOrderItems(productIds: unknown[], quantities: unknown[]): ParseItemsResult {
  const merged = new Map<number, number>();
  for (const [i, rawId] of productIds.entries()) {
    if (text(rawId) === "") continue;
    const productId = parseId(text(rawId));
    if (productId === null) return { success: false, error: `แถวที่ ${i + 1}: เลือกสินค้าไม่ถูกต้อง` };
    const quantity = wholeNumber(quantities[i]);
    if (quantity === null || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      return { success: false, error: `แถวที่ ${i + 1}: จำนวนต้องเป็นจำนวนเต็ม 1–10,000` };
    }
    merged.set(productId, (merged.get(productId) ?? 0) + quantity);
  }

  if (merged.size === 0) return { success: false, error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" };
  if ([...merged.values()].some((quantity) => quantity > MAX_ITEM_QUANTITY)) {
    return { success: false, error: "สินค้าเดียวกันรวมกันได้ไม่เกิน 10,000 ชิ้น" };
  }
  return { success: true, items: [...merged].map(([productId, quantity]) => ({ productId, quantity })) };
}

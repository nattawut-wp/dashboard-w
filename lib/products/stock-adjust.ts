import { MAX_STOCK } from "./validation";

/** RECEIVE = รับเข้า (+), DEDUCT = ตัดออก (−), SET = ตั้งยอดใหม่ (=) หลังนับของจริง */
export const STOCK_ADJUST_MODES = ["RECEIVE", "DEDUCT", "SET"] as const;
export type StockAdjustMode = (typeof STOCK_ADJUST_MODES)[number];

export type StockAdjustResult =
  | { success: true; data: { mode: StockAdjustMode; quantity: number; newStock: number } }
  | { success: false; errors: { mode?: string; quantity?: string } };

function isMode(value: unknown): value is StockAdjustMode {
  return STOCK_ADJUST_MODES.some((mode) => mode === value);
}

/** "1,200" → 1200 ; ไม่ใช่จำนวนเต็มเขียนปกติ → null */
function parseWholeNumber(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/,/g, "");
  return /^\d+$/.test(text) ? Number(text) : null;
}

const fail = (errors: { mode?: string; quantity?: string }): StockAdjustResult => ({ success: false, errors });

/**
 * ตรวจฟอร์ม "ปรับสต็อก" และคำนวณคงเหลือหลังปรับ
 * `currentStock` = คงเหลือตอนเปิดฟอร์ม (ตอนบันทึกจริงฐานข้อมูลเช็คซ้ำอีกชั้น กันกรณีมีคนขายไปพร้อมกัน)
 */
export function parseStockAdjustment(
  input: { mode: unknown; quantity: unknown },
  currentStock: number,
): StockAdjustResult {
  const { mode } = input;
  if (!isMode(mode)) return fail({ mode: "กรุณาเลือกประเภทการปรับ" });

  const quantity = parseWholeNumber(input.quantity);
  const min = mode === "SET" ? 0 : 1;
  if (quantity === null || quantity < min) {
    return fail({ quantity: `จำนวนต้องเป็นจำนวนเต็มตั้งแต่ ${min} ขึ้นไป` });
  }

  if (mode === "DEDUCT" && quantity > currentStock) {
    return fail({ quantity: `ตัดได้ไม่เกิน ${currentStock} ชิ้น (คงเหลือตอนนี้)` });
  }
  if (mode === "SET" && quantity === currentStock) {
    return fail({ quantity: "จำนวนเท่าเดิม ไม่มีอะไรเปลี่ยน" });
  }

  const newStock =
    mode === "RECEIVE" ? currentStock + quantity : mode === "DEDUCT" ? currentStock - quantity : quantity;
  if (newStock > MAX_STOCK) return fail({ quantity: "คงเหลือต้องไม่เกิน 1,000,000 ชิ้น" });

  return { success: true, data: { mode, quantity, newStock } };
}

/** OUT = หมด, LOW = ใกล้หมด, OK = ปกติ */
export type StockLevel = "OUT" | "LOW" | "OK";

/**
 * ระดับสต็อก: เหลือ 0 = หมด, เหลือ ≤ เกณฑ์ = ใกล้หมด (เกณฑ์ 0 = ไม่ต้องเตือนใกล้หมด)
 * ค่าผิดปกติ (ติดลบ / NaN) ถือว่าหมด — เตือนเกินดีกว่าบอกว่าปกติ
 */
export function stockLevel(stock: number, lowStockThreshold: number): StockLevel {
  if (!(stock > 0)) return "OUT";
  if (stock <= lowStockThreshold) return "LOW";
  return "OK";
}

const LABELS: Record<StockLevel, string> = { OUT: "หมด", LOW: "ใกล้หมด", OK: "มีของ" };

export function stockLevelLabel(level: StockLevel): string {
  return LABELS[level];
}

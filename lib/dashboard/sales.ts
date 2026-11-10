import type { OrderStatus } from "@/lib/orders/status";
import { bangkokDateKey, lastBangkokDays, startOfBangkokDay, startOfBangkokMonth } from "./dates";

/** "1250.5" → 125050 — แปลงจากข้อความตรงๆ (ไม่คูณทศนิยม เพราะ 0.29 * 100 = 28.999…) */
export function toSatang(total: string): number {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(total.trim());
  if (!match) return 0;
  const [, sign, baht, fraction = ""] = match;
  const satang = Number(baht) * 100 + Number(fraction.padEnd(2, "0"));
  return sign ? -satang : satang;
}

export type SaleInput = { status: OrderStatus; orderedAt: Date; total: string };

/** นับเป็นยอดขาย: ชำระแล้ว / จัดส่งแล้ว (COD ยังไม่จ่ายจนกว่าจะส่ง → นับเมื่อส่ง) */
export function isSale(status: OrderStatus): boolean {
  return status === "PAID" || status === "SHIPPED";
}

/** ยอดวันนี้ / เดือนนี้ (ตามเวลาไทย) + ยอดเฉลี่ยต่อออร์เดอร์ของเดือน — หน่วยสตางค์ */
export function summarizeSales(orders: SaleInput[], now: Date) {
  const todayStart = startOfBangkokDay(now).getTime();
  const monthStart = startOfBangkokMonth(now).getTime();
  const today = { total: 0, count: 0 };
  const month = { total: 0, count: 0 };

  for (const order of orders) {
    if (!isSale(order.status)) continue;
    const time = order.orderedAt.getTime();
    const satang = toSatang(order.total);
    if (time >= monthStart) {
      month.total += satang;
      month.count += 1;
    }
    if (time >= todayStart) {
      today.total += satang;
      today.count += 1;
    }
  }

  // ไม่มีออร์เดอร์ → ไม่มีค่าเฉลี่ย (null แสดงเป็น "—") แทน NaN
  const average = month.count > 0 ? Math.round(month.total / month.count) : null;
  return { today, month: { ...month, average } };
}

export type DailySales = { date: string; total: number; count: number };

/**
 * ยอดขายรายวัน `days` วันล่าสุด (เวลาไทย) สำหรับกราฟ — วันที่ไม่มีขายเป็น 0
 * รวมเป็นสตางค์ก่อนแล้วค่อยแปลงเป็นบาท (ทศนิยมไม่เพี้ยน)
 */
export function dailySales(orders: SaleInput[], now: Date, days: number): DailySales[] {
  const byDay = new Map(lastBangkokDays(now, days).map((date) => [date, { satang: 0, count: 0 }]));
  for (const order of orders) {
    if (!isSale(order.status)) continue;
    const day = byDay.get(bangkokDateKey(order.orderedAt));
    if (!day) continue; // นอกช่วง
    day.satang += toSatang(order.total);
    day.count += 1;
  }
  return [...byDay].map(([date, { satang, count }]) => ({ date, total: satang / 100, count }));
}

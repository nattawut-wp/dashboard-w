import { SHOP_TIME_ZONE } from "@/lib/orders/format";

// en-CA ให้รูปแบบ YYYY-MM-DD
const dateKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: SHOP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** วันที่ตามเวลาไทยในรูป "YYYY-MM-DD" (ใช้จัดกลุ่มยอดขายรายวัน) */
export function bangkokDateKey(date: Date): string {
  return dateKey.format(date);
}

// ไทยไม่มีเวลาออมแสง → UTC+7 ตลอดปี
const BANGKOK_OFFSET = "+07:00";

/** เที่ยงคืนเวลาไทยของวันที่ `now` อยู่ */
export function startOfBangkokDay(now: Date): Date {
  return new Date(`${bangkokDateKey(now)}T00:00:00${BANGKOK_OFFSET}`);
}

/** เที่ยงคืนเวลาไทยของวันที่ 1 ในเดือนที่ `now` อยู่ */
export function startOfBangkokMonth(now: Date): Date {
  return new Date(`${bangkokDateKey(now).slice(0, 7)}-01T00:00:00${BANGKOK_OFFSET}`);
}

const DAY_MS = 86_400_000;

/** วันที่ (เวลาไทย) ย้อนหลัง `days` วัน เรียงเก่า → ใหม่ จบที่วันนี้ — ใช้เป็นแกนกราฟรายวัน */
export function lastBangkokDays(now: Date, days: number): string[] {
  const today = startOfBangkokDay(now).getTime();
  return Array.from({ length: Math.max(0, days) }, (_, i) =>
    // +12 ชม. = กลางวันของวันนั้น (กันพลาดเรื่องขอบเที่ยงคืน)
    bangkokDateKey(new Date(today - (days - 1 - i) * DAY_MS + 12 * 3_600_000)),
  );
}

const shortThaiDate = new Intl.DateTimeFormat("th-TH", { timeZone: SHOP_TIME_ZONE, day: "numeric", month: "short" });

/** "2026-11-09" → "9 พ.ย." (ป้ายแกนกราฟ / tooltip) — ค่าผิดรูปแบบ → "" */
export function formatShortThaiDate(key: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return "";
  return shortThaiDate.format(new Date(`${key}T12:00:00${BANGKOK_OFFSET}`));
}

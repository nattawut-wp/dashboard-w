const baht = new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" });

export const SHOP_TIME_ZONE = "Asia/Bangkok";

const thaiDateTimeParts = new Intl.DateTimeFormat("th-TH", {
  timeZone: SHOP_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatThaiDateTime(date: Date): string {
  if (Number.isNaN(date.getTime())) return "—";
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    thaiDateTimeParts.formatToParts(date).find((p) => p.type === type)?.value;
  return `${part("day")} ${part("month")} ${part("year")} ${part("hour")}:${part("minute")}`;
}

export function formatOrderNumber(id: number): string {
  if (!Number.isInteger(id) || id <= 0) return "—";
  return `#${String(id).padStart(6, "0")}`;
}

/**
 * ใส่ขีดให้อ่านง่าย (ฐานข้อมูลเก็บตัวเลขล้วน เพื่อให้ค้นหาเบอร์ได้)
 * มือถือ 0806718527 → 080-671-8527 / เบอร์บ้าน 021234567 → 02-123-4567
 * รูปแบบอื่นแสดงตามที่เก็บไว้
 */
export function formatThaiPhone(phone: string | null | undefined): string {
  const value = phone?.trim();
  if (!value) return "—";
  const mobile = value.match(/^(0\d{2})(\d{3})(\d{4})$/);
  if (mobile) return mobile.slice(1).join("-");
  const landline = value.match(/^(0\d)(\d{3})(\d{4})$/);
  if (landline) return landline.slice(1).join("-");
  return value;
}

/** ยอดเงินรับได้ทั้ง number, ข้อความตัวเลข และ Prisma.Decimal (มี toString) */
export type MoneyLike = number | string | { toString(): string };

export function formatBaht(amount: MoneyLike | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const text = amount.toString().trim();
  const value = Number(text);
  // Number("") ได้ 0 → ต้องดักข้อความว่างก่อน ไม่งั้นแสดง ฿0.00 ทั้งที่ไม่มีค่า
  if (text === "" || Number.isNaN(value)) return "—";
  return baht.format(value);
}

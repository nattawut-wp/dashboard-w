import { firstParam, type SearchParams } from "@/lib/list-params";
import { bangkokDateKey } from "@/lib/dashboard/dates";

const MIN_YEAR = 2000;

/** "?date=2026-11-11" → "2026-11-11" — ต้องเป็นวันที่มีจริง ไม่งั้น undefined (= ไม่กรองวัน) */
export function parseDateKey(value: SearchParams[string]): string | undefined {
  const text = firstParam(value) ?? "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return undefined;
  const [year, month, day] = match.slice(1).map(Number);
  if (year < MIN_YEAR) return undefined;
  const date = new Date(Date.UTC(year, month - 1, day));
  const real = date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return real ? text : undefined;
}

/** "?month=2026-11" → "2026-11" (เดือนที่ปฏิทินแสดง) — ค่าผิด → undefined */
export function parseMonthKey(value: SearchParams[string]): string | undefined {
  const text = firstParam(value) ?? "";
  const match = /^(\d{4})-(\d{2})$/.exec(text);
  if (!match) return undefined;
  const [year, month] = match.slice(1).map(Number);
  return year >= MIN_YEAR && month >= 1 && month <= 12 ? text : undefined;
}

/** "2026-12" + 1 → "2027-01" (ปุ่ม ‹ ›) */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

/** ปฏิทินทั้งเดือน: แถวละ 7 วัน (อาทิตย์ → เสาร์) ช่องที่อยู่นอกเดือน = null */
export function monthGrid(monthKey: string): (string | null)[][] {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = อาทิตย์
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => `${monthKey}-${String(i + 1).padStart(2, "0")}`),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}

// ไทยไม่มีเวลาออมแสง → UTC+7 ตลอดปี
const DAY_MS = 86_400_000;

function bangkokMidnight(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00+07:00`);
}

/** ช่วงเวลาของวันนั้นตามเวลาไทย สำหรับ where ของ Prisma: { gte, lt } */
export function bangkokDayRange(dateKey: string): { gte: Date; lt: Date } {
  const gte = bangkokMidnight(dateKey);
  return { gte, lt: new Date(gte.getTime() + DAY_MS) };
}

/** ช่วงเวลาทั้งเดือนตามเวลาไทย: { gte: วันที่ 1, lt: วันที่ 1 ของเดือนถัดไป } */
export function bangkokMonthRange(monthKey: string): { gte: Date; lt: Date } {
  return { gte: bangkokMidnight(`${monthKey}-01`), lt: bangkokMidnight(`${shiftMonth(monthKey, 1)}-01`) };
}

/** จำนวนออร์เดอร์ต่อวัน (เวลาไทย) → { "2026-11-11": 3 } — ตัวเลขเล็กๆ ใต้วันที่ในปฏิทิน */
export function countByBangkokDay(dates: (Date | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const date of dates) {
    if (!date) continue;
    const key = bangkokDateKey(date);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

/** เดือนที่ปฏิทินแสดง: ?month= → เดือนของวันที่เลือก → เดือนนี้ (เวลาไทย) */
export function visibleMonth({ month, date }: { month?: string; date?: string }, now: Date): string {
  return month ?? date?.slice(0, 7) ?? bangkokDateKey(now).slice(0, 7);
}

import { describe, expect, it } from "vitest";
import {
  bangkokDateKey,
  formatShortThaiDate,
  lastBangkokDays,
  startOfBangkokDay,
  startOfBangkokMonth,
} from "./dates";

describe("bangkokDateKey", () => {
  it("วันตามเวลาไทย: 23:59 น. ไทย = วันเดิม, 00:00 น. ไทย = วันใหม่ (แม้ UTC ยังเป็นวันก่อน)", () => {
    expect(bangkokDateKey(new Date("2026-11-09T16:59:59Z"))).toBe("2026-11-09"); // 23:59:59 ไทย
    expect(bangkokDateKey(new Date("2026-11-09T17:00:00Z"))).toBe("2026-11-10"); // 00:00 ไทย
  });
});

describe("startOfBangkokDay / startOfBangkokMonth", () => {
  it("เที่ยงคืนไทยของวันนี้ / วันที่ 1 ของเดือนนี้ (= 17:00 UTC ของวันก่อน)", () => {
    const now = new Date("2026-11-10T03:00:00Z"); // 10 พ.ย. 10:00 ไทย
    expect(startOfBangkokDay(now)).toEqual(new Date("2026-11-09T17:00:00Z"));
    expect(startOfBangkokMonth(now)).toEqual(new Date("2026-10-31T17:00:00Z"));
  });

  it("ขอบ: 00:30 ไทยของวันที่ 1 (UTC ยังเป็นเดือนก่อน) → เดือนใหม่ / สิ้นปี → ปีใหม่", () => {
    const firstOfMonth = new Date("2026-11-30T17:30:00Z"); // 1 ธ.ค. 00:30 ไทย
    expect(startOfBangkokDay(firstOfMonth)).toEqual(new Date("2026-11-30T17:00:00Z"));
    expect(startOfBangkokMonth(firstOfMonth)).toEqual(new Date("2026-11-30T17:00:00Z"));
    const newYear = new Date("2026-12-31T18:00:00Z"); // 1 ม.ค. 2027 01:00 ไทย
    expect(startOfBangkokMonth(newYear)).toEqual(new Date("2026-12-31T17:00:00Z"));
  });
});

describe("lastBangkokDays", () => {
  it("N วันล่าสุด เก่า → ใหม่ จบที่วันนี้ (ข้ามเดือนได้)", () => {
    const now = new Date("2026-11-01T20:00:00Z"); // 2 พ.ย. 03:00 ไทย
    expect(lastBangkokDays(now, 4)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
    expect(lastBangkokDays(now, 30)).toHaveLength(30);
    expect(lastBangkokDays(now, 30)[0]).toBe("2026-10-04");
  });

  it("0 วัน / ติดลบ → [] ", () => {
    expect(lastBangkokDays(new Date(), 0)).toEqual([]);
    expect(lastBangkokDays(new Date(), -3)).toEqual([]);
  });
});

describe("formatShortThaiDate (ป้ายแกนกราฟ)", () => {
  it("'2026-11-09' → '9 พ.ย.', 1 ม.ค. / 31 ธ.ค. / ค่าผิด → ''", () => {
    expect(formatShortThaiDate("2026-11-09")).toBe("9 พ.ย.");
    expect(formatShortThaiDate("2027-01-01")).toBe("1 ม.ค.");
    expect(formatShortThaiDate("2026-12-31")).toBe("31 ธ.ค.");
    expect(formatShortThaiDate("abc")).toBe("");
  });
});

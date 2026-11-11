import { describe, expect, it } from "vitest";
import { bangkokDayRange, bangkokMonthRange, countByBangkokDay, monthGrid, parseDateKey, parseMonthKey, shiftMonth, visibleMonth } from "./calendar";

describe("parseDateKey", () => {
  it("รับเฉพาะ YYYY-MM-DD ที่เป็นวันจริง / ค่าอื่น → undefined", () => {
    expect(parseDateKey("2026-11-11")).toBe("2026-11-11");
    expect(parseDateKey(["2028-02-29", "x"])).toBe("2028-02-29"); // ปีอธิกสุรทิน
    for (const value of [undefined, "", "2026-2-1", "2026-13-01", "2026-02-29", "2026-04-31", "2026-00-10", "2026-11-00", "11/11/2026", " 2026-11-11", "1999-12-31"]) {
      expect(parseDateKey(value)).toBeUndefined();
    }
  });
});

describe("parseMonthKey", () => {
  it("รับเฉพาะ YYYY-MM ที่เดือน 01–12 / ค่าอื่น → undefined", () => {
    expect(parseMonthKey("2026-11")).toBe("2026-11");
    expect(parseMonthKey(["2027-01"])).toBe("2027-01");
    for (const value of [undefined, "", "2026-1", "2026-13", "2026-00", "2026-11-01", "1999-12", "abc"]) {
      expect(parseMonthKey(value)).toBeUndefined();
    }
  });
});

describe("shiftMonth", () => {
  it("เลื่อนเดือน ข้ามปีได้ / 0 = เดือนเดิม", () => {
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-03", -14)).toBe("2025-01");
    expect(shiftMonth("2026-05", 0)).toBe("2026-05");
  });
});

describe("monthGrid", () => {
  it("แบ่งเป็นสัปดาห์ เริ่มวันอาทิตย์ ช่องนอกเดือน = null", () => {
    const weeks = monthGrid("2026-11"); // 1 พ.ย. 2026 = วันอาทิตย์, 30 วัน
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual(["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07"]);
    expect(weeks[4]).toEqual(["2026-11-29", "2026-11-30", null, null, null, null, null]);
  });

  it("ขอบ: เดือนเริ่มวันเสาร์ (6 สัปดาห์) / ก.พ. ที่พอดี 4 สัปดาห์ / ก.พ. ปีอธิกสุรทิน", () => {
    const aug = monthGrid("2026-08"); // 1 ส.ค. 2026 = วันเสาร์, 31 วัน
    expect(aug).toHaveLength(6);
    expect(aug[0]).toEqual([null, null, null, null, null, null, "2026-08-01"]);
    expect(aug[5][0]).toBe("2026-08-30");
    expect(aug[5][1]).toBe("2026-08-31");
    expect(monthGrid("2015-02")).toHaveLength(4); // 1 ก.พ. 2015 = อาทิตย์, 28 วัน
    expect(monthGrid("2028-02").flat().filter(Boolean)).toHaveLength(29);
    for (const week of aug) expect(week).toHaveLength(7);
  });
});

describe("bangkokDayRange / bangkokMonthRange", () => {
  it("ช่วง [เที่ยงคืนไทย, เที่ยงคืนไทยถัดไป) — ข้ามเดือน/ข้ามปีได้", () => {
    expect(bangkokDayRange("2026-11-11")).toEqual({
      gte: new Date("2026-11-10T17:00:00Z"),
      lt: new Date("2026-11-11T17:00:00Z"),
    });
    expect(bangkokDayRange("2026-12-31").lt).toEqual(new Date("2026-12-31T17:00:00Z"));
    expect(bangkokMonthRange("2026-11")).toEqual({
      gte: new Date("2026-10-31T17:00:00Z"),
      lt: new Date("2026-11-30T17:00:00Z"),
    });
    expect(bangkokMonthRange("2026-12").lt).toEqual(new Date("2026-12-31T17:00:00Z"));
  });
});

describe("countByBangkokDay", () => {
  it("นับตามวันไทย: 23:59 ไทย กับ 00:00 ไทย อยู่คนละวัน / null ไม่นับ / ว่าง → {}", () => {
    expect(
      countByBangkokDay([
        new Date("2026-11-10T16:59:59Z"), // 10 พ.ย. 23:59 ไทย
        new Date("2026-11-10T17:00:00Z"), // 11 พ.ย. 00:00 ไทย
        new Date("2026-11-11T05:00:00Z"), // 11 พ.ย. 12:00 ไทย
        null,
      ]),
    ).toEqual({ "2026-11-10": 1, "2026-11-11": 2 });
    expect(countByBangkokDay([])).toEqual({});
  });
});

describe("visibleMonth", () => {
  const now = new Date("2026-11-30T17:30:00Z"); // 1 ธ.ค. 00:30 ไทย (UTC ยังเป็น พ.ย.)

  it("ลำดับ: เดือนใน URL → เดือนของวันที่เลือก → เดือนนี้ตามเวลาไทย", () => {
    expect(visibleMonth({ month: "2026-05", date: "2026-11-11" }, now)).toBe("2026-05");
    expect(visibleMonth({ date: "2026-11-11" }, now)).toBe("2026-11");
    expect(visibleMonth({}, now)).toBe("2026-12");
  });
});

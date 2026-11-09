import { describe, expect, it } from "vitest";
import { parseBangkokDateTimeInput, toBangkokDateTimeInput } from "./datetime";

describe("toBangkokDateTimeInput", () => {
  it("Date → ค่าสำหรับช่อง datetime-local ตามเวลาไทย", () => {
    expect(toBangkokDateTimeInput(new Date("2026-11-09T07:30:45Z"))).toBe("2026-11-09T14:30");
  });

  it("กรณีขอบ: ข้ามเที่ยงคืนไทย, ต้นปี, วันที่ไม่ถูกต้อง → ''", () => {
    expect(toBangkokDateTimeInput(new Date("2026-11-08T17:00:00Z"))).toBe("2026-11-09T00:00");
    expect(toBangkokDateTimeInput(new Date("2025-12-31T17:05:00Z"))).toBe("2026-01-01T00:05");
    expect(toBangkokDateTimeInput(new Date("bad"))).toBe("");
  });

  it("แปลงไป-กลับแล้วได้ค่าเดิม", () => {
    const typed = "2026-03-05T08:07";
    expect(toBangkokDateTimeInput(parseBangkokDateTimeInput(typed)!)).toBe(typed);
  });
});

describe("parseBangkokDateTimeInput", () => {
  it("ค่าจากช่อง datetime-local → ตีความเป็นเวลาไทย (UTC+7)", () => {
    expect(parseBangkokDateTimeInput("2026-11-09T14:30")?.toISOString()).toBe(
      "2026-11-09T07:30:00.000Z",
    );
  });

  it("ว่าง / null / รูปแบบผิด → null", () => {
    expect(parseBangkokDateTimeInput("")).toBeNull();
    expect(parseBangkokDateTimeInput(null)).toBeNull();
    expect(parseBangkokDateTimeInput("hello")).toBeNull();
    expect(parseBangkokDateTimeInput("2026-11-09")).toBeNull(); // ไม่มีเวลา
    expect(parseBangkokDateTimeInput("2026-11-09T14:30Z")).toBeNull(); // มีโซนเวลาแปลกปน
  });

  describe("กรณีขอบ", () => {
    it("วันที่ไม่มีจริง → null (ไม่เลื่อนไปวันอื่นเอง)", () => {
      expect(parseBangkokDateTimeInput("2026-02-30T10:00")).toBeNull();
      expect(parseBangkokDateTimeInput("2026-13-01T10:00")).toBeNull();
      expect(parseBangkokDateTimeInput("2026-11-09T25:00")).toBeNull();
    });

    it("29 ก.พ. ปีอธิกสุรทิน ใช้ได้ / ปีปกติไม่ได้", () => {
      expect(parseBangkokDateTimeInput("2028-02-29T10:00")).not.toBeNull();
      expect(parseBangkokDateTimeInput("2026-02-29T10:00")).toBeNull();
    });

    it("เที่ยงคืนไทย → 17:00 UTC ของวันก่อน", () => {
      expect(parseBangkokDateTimeInput("2026-11-09T00:00")?.toISOString()).toBe(
        "2026-11-08T17:00:00.000Z",
      );
    });

    it("มีวินาทีมาด้วย → ใช้ได้", () => {
      expect(parseBangkokDateTimeInput("2026-11-09T14:30:45")?.toISOString()).toBe(
        "2026-11-09T07:30:45.000Z",
      );
    });
  });
});

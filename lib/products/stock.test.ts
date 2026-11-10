import { describe, expect, it } from "vitest";
import { stockLevel, stockLevelLabel } from "./stock";

describe("stockLevel", () => {
  it("เหลือ 0 → หมด (OUT)", () => {
    expect(stockLevel(0, 5)).toBe("OUT");
  });

  it("เหลือเท่ากับเกณฑ์พอดี → ใกล้หมด (LOW), มากกว่าเกณฑ์ 1 → ปกติ (OK)", () => {
    expect(stockLevel(5, 5)).toBe("LOW");
    expect(stockLevel(1, 5)).toBe("LOW");
    expect(stockLevel(6, 5)).toBe("OK");
  });

  describe("กรณีขอบ", () => {
    it("เกณฑ์ = 0 (ไม่ต้องเตือน) → เหลือ 1 ก็ปกติ, เหลือ 0 ยังเป็นหมด", () => {
      expect(stockLevel(1, 0)).toBe("OK");
      expect(stockLevel(0, 0)).toBe("OUT");
    });

    it("ค่าติดลบ / ไม่ใช่ตัวเลข (ไม่ควรเกิด) → ถือว่าหมด ไม่ใช่ปกติ", () => {
      expect(stockLevel(-1, 5)).toBe("OUT");
      expect(stockLevel(Number.NaN, 5)).toBe("OUT");
    });
  });
});

describe("stockLevelLabel", () => {
  it("แปลงเป็นภาษาไทย", () => {
    expect((["OUT", "LOW", "OK"] as const).map(stockLevelLabel)).toEqual([
      "หมด",
      "ใกล้หมด",
      "มีของ",
    ]);
  });
});

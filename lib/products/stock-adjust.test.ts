import { describe, expect, it } from "vitest";
import { parseStockAdjustment } from "./stock-adjust";

describe("parseStockAdjustment", () => {
  it("รับเข้า 10 ชิ้น ตอนเหลือ 5 → คงเหลือ 15", () => {
    expect(parseStockAdjustment({ mode: "RECEIVE", quantity: "10" }, 5)).toEqual({
      success: true,
      data: { mode: "RECEIVE", quantity: 10, newStock: 15 },
    });
  });

  it("ตัดออก: 3 จาก 5 → 2, ตัดหมดพอดี 5 → 0, ตัด 6 → 'ตัดได้ไม่เกิน 5 ชิ้น (คงเหลือตอนนี้)'", () => {
    expect(parseStockAdjustment({ mode: "DEDUCT", quantity: "3" }, 5)).toEqual({
      success: true,
      data: { mode: "DEDUCT", quantity: 3, newStock: 2 },
    });
    const all = parseStockAdjustment({ mode: "DEDUCT", quantity: "5" }, 5);
    expect(all.success && all.data.newStock).toBe(0);
    expect(parseStockAdjustment({ mode: "DEDUCT", quantity: "6" }, 5)).toEqual({
      success: false,
      errors: { quantity: "ตัดได้ไม่เกิน 5 ชิ้น (คงเหลือตอนนี้)" },
    });
  });

  it("ตั้งยอดใหม่ (นับของจริงได้เท่านี้): 12 → 12, 0 → 0, เท่าเดิม → 'จำนวนเท่าเดิม ไม่มีอะไรเปลี่ยน'", () => {
    expect(parseStockAdjustment({ mode: "SET", quantity: "12" }, 5)).toEqual({
      success: true,
      data: { mode: "SET", quantity: 12, newStock: 12 },
    });
    const zero = parseStockAdjustment({ mode: "SET", quantity: "0" }, 5);
    expect(zero.success && zero.data.newStock).toBe(0);
    expect(parseStockAdjustment({ mode: "SET", quantity: "5" }, 5)).toEqual({
      success: false,
      errors: { quantity: "จำนวนเท่าเดิม ไม่มีอะไรเปลี่ยน" },
    });
  });

  describe("กรณีขอบ", () => {
    const quantityError = (mode: string, quantity: unknown) => {
      const result = parseStockAdjustment({ mode, quantity }, 5);
      return result.success ? null : result.errors.quantity;
    };

    it("รับเข้า / ตัดออก: 0 ว่าง ติดลบ ทศนิยม ข้อความ null → 'จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป'", () => {
      for (const mode of ["RECEIVE", "DEDUCT"]) {
        for (const quantity of ["0", "", "-2", "1.5", "abc", null, "1e2"]) {
          expect(quantityError(mode, quantity)).toBe("จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
        }
      }
    });

    it("ตั้งยอดใหม่: ว่าง ติดลบ ทศนิยม → 'จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป'", () => {
      for (const quantity of ["", "-1", "2.5", null]) {
        expect(quantityError("SET", quantity)).toBe("จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป");
      }
    });
    it("ยอดหลังปรับเกิน 1,000,000 → 'คงเหลือต้องไม่เกิน 1,000,000 ชิ้น' (เท่ากับพอดีผ่าน)", () => {
      expect(quantityError("RECEIVE", "999995")).toBeNull(); // 5 + 999,995 = 1,000,000
      expect(quantityError("RECEIVE", "999996")).toBe("คงเหลือต้องไม่เกิน 1,000,000 ชิ้น");
      expect(quantityError("SET", "1000001")).toBe("คงเหลือต้องไม่เกิน 1,000,000 ชิ้น");
    });

    it("ประเภทการปรับไม่ถูกต้อง / ไม่ส่งมา → 'กรุณาเลือกประเภทการปรับ' (ไม่เดาเป็นรับเข้า)", () => {
      for (const mode of ["", null, "ADD", "receive", "toString"]) {
        expect(parseStockAdjustment({ mode, quantity: "1" }, 5)).toEqual({
          success: false,
          errors: { mode: "กรุณาเลือกประเภทการปรับ" },
        });
      }
    });
  });
});

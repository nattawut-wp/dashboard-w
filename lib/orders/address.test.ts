import { describe, expect, it } from "vitest";
import { needsShippingAddress } from "./address";

describe("needsShippingAddress (เตือน 'ยังไม่มีที่อยู่จัดส่ง')", () => {
  it("ชำระแล้วแต่ไม่มีที่อยู่ → เตือน", () => {
    expect(needsShippingAddress("PAID", null)).toBe(true);
  });

  it("ชำระแล้ว + ที่อยู่ว่าง/มีแต่ช่องว่าง → เตือน, มีที่อยู่ → ไม่เตือน", () => {
    expect(needsShippingAddress("PAID", "")).toBe(true);
    expect(needsShippingAddress("PAID", "   ")).toBe(true);
    expect(needsShippingAddress("PAID", "45 หมู่ 3 นนทบุรี")).toBe(false);
  });

  it("สถานะอื่น (รอชำระ / ส่งแล้ว / ยกเลิก) → ไม่เตือน แม้ไม่มีที่อยู่", () => {
    for (const status of ["PENDING", "SHIPPED", "CANCELLED"] as const) {
      expect(needsShippingAddress(status, null)).toBe(false);
    }
  });
});

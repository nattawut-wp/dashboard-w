import { describe, expect, it } from "vitest";
import { summarizeItems } from "./items-summary";

const item = (productName: string, quantity: number) => ({ productName, quantity });

describe("summarizeItems", () => {
  it("1–2 รายการ → 'ชื่อ ×จำนวน' คั่นด้วยจุลภาค + รวมจำนวนชิ้น", () => {
    expect(summarizeItems([item("เคสโทรศัพท์ใส", 2), item("หมวกแก๊ป", 1)])).toEqual({
      text: "เคสโทรศัพท์ใส ×2, หมวกแก๊ป ×1",
      totalQuantity: 3,
    });
  });

  it("เกิน 2 รายการ → แสดง 2 รายการแรก + 'อีก N รายการ' / ไม่มีรายการ → ข้อความว่าง 0 ชิ้น", () => {
    expect(
      summarizeItems([item("เสื้อ", 1), item("หมวก", 2), item("ถุงเท้า", 3), item("ร่ม", 1)]),
    ).toEqual({ text: "เสื้อ ×1, หมวก ×2 +อีก 2 รายการ", totalQuantity: 7 });
    expect(summarizeItems([])).toEqual({ text: "", totalQuantity: 0 });
  });
});

import { describe, expect, it } from "vitest";
import { parseOrderItems } from "./items";

describe("parseOrderItems", () => {
  it("แถวสินค้า + จำนวน → รายการพร้อมบันทึก", () => {
    expect(parseOrderItems(["3", "7"], ["2", "1"])).toEqual({
      success: true,
      items: [
        { productId: 3, quantity: 2 },
        { productId: 7, quantity: 1 },
      ],
    });
  });

  it("แถวที่ยังไม่เลือกสินค้า → ข้าม / ไม่มีสินค้าเลย → 'กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'", () => {
    expect(parseOrderItems(["", "5", "  "], ["", "3", "9"])).toEqual({
      success: true,
      items: [{ productId: 5, quantity: 3 }],
    });
    for (const [ids, quantities] of [[[], []], [[""], ["1"]], [[null], [null]]] as unknown[][][]) {
      expect(parseOrderItems(ids, quantities)).toEqual({
        success: false,
        error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ",
      });
    }
  });

  it("จำนวน 0 / ว่าง / ติดลบ / ทศนิยม / ข้อความ / เกิน 10,000 → 'แถวที่ N: จำนวนต้องเป็นจำนวนเต็ม 1–10,000'", () => {
    for (const quantity of ["0", "", "-1", "1.5", "abc", "1e2", "10001", null]) {
      expect(parseOrderItems(["3", "4"], ["1", quantity])).toEqual({
        success: false,
        error: "แถวที่ 2: จำนวนต้องเป็นจำนวนเต็ม 1–10,000",
      });
    }
    const max = parseOrderItems(["3"], ["10,000"]);
    expect(max.success && max.items[0].quantity).toBe(10_000);
  });

  it("รหัสสินค้าปลอม (ไม่ใช่ตัวเลข / 0 / ติดลบ / เกิน int) → 'แถวที่ N: เลือกสินค้าไม่ถูกต้อง'", () => {
    for (const id of ["abc", "0", "-3", "1.5", "2147483648"]) {
      expect(parseOrderItems([id], ["1"])).toEqual({ success: false, error: "แถวที่ 1: เลือกสินค้าไม่ถูกต้อง" });
    }
  });

  it("เลือกสินค้าเดียวกันหลายแถว → รวมเป็นแถวเดียว (บวกจำนวน), รวมแล้วเกิน 10,000 → แจ้งเตือน", () => {
    expect(parseOrderItems(["3", "7", "3"], ["2", "1", "5"])).toEqual({
      success: true,
      items: [
        { productId: 3, quantity: 7 },
        { productId: 7, quantity: 1 },
      ],
    });
    expect(parseOrderItems(["3", "3"], ["6000", "5000"])).toEqual({
      success: false,
      error: "สินค้าเดียวกันรวมกันได้ไม่เกิน 10,000 ชิ้น",
    });
  });
});

import { describe, expect, it } from "vitest";
import { shortageMessage, stockChanges } from "./stock-changes";

const item = (productId: number, quantity: number) => ({ productId, quantity });

describe("stockChanges (ติดลบ = ตัดสต็อก, บวก = คืนสต็อก)", () => {
  it("สร้างออร์เดอร์ใหม่ → ตัดสต็อกตามจำนวน", () => {
    expect(stockChanges(null, { status: "PAID", items: [item(3, 2), item(7, 1)] })).toEqual([
      { productId: 3, delta: -2 },
      { productId: 7, delta: -1 },
    ]);
  });

  it("ลบออร์เดอร์ → คืนสต็อกทั้งหมด", () => {
    expect(stockChanges({ status: "SHIPPED", items: [item(3, 2), item(7, 1)] }, null)).toEqual([
      { productId: 3, delta: 2 },
      { productId: 7, delta: 1 },
    ]);
  });

  describe("สถานะยกเลิก = ไม่จองสต็อก", () => {
    const items = [item(3, 2)];

    it("เปลี่ยนเป็นยกเลิก → คืนสต็อก / ยกเลิกกลับเป็นชำระแล้ว → ตัดอีกครั้ง", () => {
      expect(stockChanges({ status: "PAID", items }, { status: "CANCELLED", items })).toEqual([
        { productId: 3, delta: 2 },
      ]);
      expect(stockChanges({ status: "CANCELLED", items }, { status: "PAID", items })).toEqual([
        { productId: 3, delta: -2 },
      ]);
    });

    it("สร้างแบบยกเลิก / ลบออร์เดอร์ที่ยกเลิกแล้ว → ไม่แตะสต็อก (ไม่คืนซ้ำ)", () => {
      expect(stockChanges(null, { status: "CANCELLED", items })).toEqual([]);
      expect(stockChanges({ status: "CANCELLED", items }, null)).toEqual([]);
    });
  });

  it("แก้ไขออร์เดอร์ → เฉพาะส่วนต่าง: เพิ่มจำนวน ตัดเพิ่ม / ลดจำนวน คืน / เอาออก คืนหมด / เพิ่มใหม่ ตัด / เท่าเดิม ไม่อยู่ในผล — เรียงตามรหัสสินค้า", () => {
    const before = { status: "PENDING" as const, items: [item(9, 1), item(3, 5), item(7, 2), item(4, 1)] };
    const after = { status: "SHIPPED" as const, items: [item(9, 4), item(3, 2), item(1, 1), item(4, 1)] };
    expect(stockChanges(before, after)).toEqual([
      { productId: 1, delta: -1 }, // เพิ่มสินค้าใหม่
      { productId: 3, delta: 3 }, // 5 → 2 คืน 3
      { productId: 7, delta: 2 }, // เอาออก คืน 2
      { productId: 9, delta: -3 }, // 1 → 4 ตัดเพิ่ม 3
    ]);
  });
});

describe("shortageMessage", () => {
  it("เหลือไม่พอ → บอกชื่อ คงเหลือ และจำนวนที่ต้องการ / หมด → 'หมดแล้ว'", () => {
    expect(shortageMessage("เสื้อยืด สีดำ L", 3, 5)).toBe("“เสื้อยืด สีดำ L” เหลือ 3 ชิ้น ไม่พอ (ต้องการ 5)");
    expect(shortageMessage("หมวกแก๊ป", 0, 1)).toBe("“หมวกแก๊ป” หมดแล้ว");
    expect(shortageMessage("ปากกา", 1200, 1500)).toBe("“ปากกา” เหลือ 1,200 ชิ้น ไม่พอ (ต้องการ 1,500)");
  });
});

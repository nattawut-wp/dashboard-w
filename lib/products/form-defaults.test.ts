import { describe, expect, it } from "vitest";
import { newProductFormDefaults, productToFormDefaults } from "./form-defaults";

describe("productToFormDefaults (หน้าแก้ไข)", () => {
  it("สินค้า → ค่าในฟอร์ม (ตัวเลขเป็นข้อความ, ไม่มีช่องจำนวนคงเหลือให้แก้)", () => {
    expect(
      productToFormDefaults({
        id: 3,
        sku: "CAP-NVY",
        name: "หมวกแก๊ป",
        stock: 7,
        lowStockThreshold: 0,
        isActive: true,
      }),
    ).toEqual({ sku: "CAP-NVY", name: "หมวกแก๊ป", lowStockThreshold: "0", stock: "" });
  });
});

describe("newProductFormDefaults (หน้าเพิ่ม)", () => {
  it("ฟอร์มว่าง จำนวนเริ่มต้น 0 เตือนเมื่อเหลือ 5", () => {
    expect(newProductFormDefaults()).toEqual({ sku: "", name: "", lowStockThreshold: "5", stock: "0" });
  });
});

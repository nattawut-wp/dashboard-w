import { describe, expect, it } from "vitest";
import { parseProductForm } from "./validation";

/** ฟอร์มที่กรอกถูกต้องครบ — แต่ละ test เปลี่ยนเฉพาะช่องที่สนใจ */
function form(overrides: Record<string, unknown> = {}) {
  return {
    sku: "TS-WHT-M",
    name: "เสื้อยืด สีขาว M",
    lowStockThreshold: "5",
    stock: "20",
    ...overrides,
  };
}

describe("parseProductForm", () => {
  it("เพิ่มสินค้า: กรอกถูกต้องครบ → ได้ข้อมูลพร้อมบันทึก", () => {
    expect(parseProductForm(form(), "create")).toEqual({
      success: true,
      data: { sku: "TS-WHT-M", name: "เสื้อยืด สีขาว M", lowStockThreshold: 5, stock: 20 },
    });
  });

  describe("รหัสสินค้า (SKU)", () => {
    const parse = (sku: unknown) => parseProductForm(form({ sku }), "create");

    it("ตัดช่องว่าง + แปลงเป็นตัวพิมพ์ใหญ่ให้ (ts-wht-m → TS-WHT-M)", () => {
      const result = parse("  ts-wht-m ");
      expect(result.success && result.data.sku).toBe("TS-WHT-M");
    });

    it("ว่าง / ช่องว่าง / null → 'กรุณากรอกรหัสสินค้า'", () => {
      for (const sku of ["", "   ", null]) {
        expect(parse(sku)).toEqual({ success: false, errors: { sku: "กรุณากรอกรหัสสินค้า" } });
      }
    });

    it("ตัวอักษรอื่นนอกจาก A–Z 0–9 และ - / ขึ้นต้นด้วย - / ยาวเกิน 30 → แจ้งรูปแบบ", () => {
      const message = "รหัสสินค้าใช้ได้เฉพาะ A–Z, 0–9 และ - (ไม่เกิน 30 ตัว ไม่ขึ้นต้นด้วย -)";
      for (const sku of ["TS WHT", "เสื้อ-01", "TS_01", "-TS", "A".repeat(31)]) {
        expect(parse(sku)).toEqual({ success: false, errors: { sku: message } });
      }
      expect(parse("A".repeat(30)).success).toBe(true);
    });
  });

  describe("ชื่อสินค้า", () => {
    it("ว่าง / null → 'กรุณากรอกชื่อสินค้า', 100 ตัวผ่าน / 101 ตัว → 'ชื่อสินค้ายาวเกิน 100 ตัวอักษร'", () => {
      for (const name of ["", "  ", null]) {
        expect(parseProductForm(form({ name }), "create")).toEqual({
          success: false,
          errors: { name: "กรุณากรอกชื่อสินค้า" },
        });
      }
      expect(parseProductForm(form({ name: "ก".repeat(100) }), "create").success).toBe(true);
      expect(parseProductForm(form({ name: "ก".repeat(101) }), "create")).toEqual({
        success: false,
        errors: { name: "ชื่อสินค้ายาวเกิน 100 ตัวอักษร" },
      });
    });
  });

  describe("จำนวนเริ่มต้น (เฉพาะตอนเพิ่มสินค้า)", () => {
    const stockResult = (stock: unknown) => {
      const result = parseProductForm(form({ stock }), "create");
      return result.success ? result.data.stock : result.errors.stock;
    };

    it("0 ผ่าน / มีคอมมา / สูงสุด 1,000,000 ผ่าน", () => {
      expect(stockResult("0")).toBe(0);
      expect(stockResult("1,200")).toBe(1200);
      expect(stockResult("1000000")).toBe(1_000_000);
    });

    it("ว่าง / ติดลบ / ทศนิยม / ไม่ใช่ตัวเลข / เกิน 1,000,000 → แจ้งเตือน", () => {
      const message = "จำนวนเริ่มต้นต้องเป็นจำนวนเต็ม 0–1,000,000";
      for (const stock of ["", null, "-1", "1.5", "1e3", "abc", "1000001"]) {
        expect(stockResult(stock)).toBe(message);
      }
    });
  });

  describe("เกณฑ์แจ้งเตือนใกล้หมด", () => {
    it("0 (ไม่เตือน) ผ่าน / สูงสุด 100,000 ผ่าน / ว่าง ติดลบ ทศนิยม เกิน → แจ้งเตือน", () => {
      const result = (lowStockThreshold: unknown) => {
        const parsed = parseProductForm(form({ lowStockThreshold }), "create");
        return parsed.success ? parsed.data.lowStockThreshold : parsed.errors.lowStockThreshold;
      };
      expect(result("0")).toBe(0);
      expect(result("100,000")).toBe(100_000);
      const message = "เกณฑ์แจ้งเตือนต้องเป็นจำนวนเต็ม 0–100,000";
      for (const value of ["", null, "-1", "2.5", "100001"]) {
        expect(result(value)).toBe(message);
      }
    });
  });

  describe("แก้ไขสินค้า", () => {
    it("ไม่รับจำนวนคงเหลือจากฟอร์ม (ต้องใช้ 'ปรับสต็อก') — ส่งมาก็ไม่สนใจ แม้ค่าจะผิด", () => {
      for (const stock of [undefined, "999", "abc"]) {
        expect(parseProductForm(form({ stock }), "update")).toEqual({
          success: true,
          data: { sku: "TS-WHT-M", name: "เสื้อยืด สีขาว M", lowStockThreshold: 5 },
        });
      }
    });
  });

  describe("กรณีขอบรวม", () => {
    it("ผิดหลายช่อง → แจ้งทุกช่องพร้อมกัน / ค่าเป็นไฟล์ → ไม่ผ่าน ไม่พัง", () => {
      expect(parseProductForm(form({ sku: "", name: "", stock: "-1" }), "create")).toEqual({
        success: false,
        errors: {
          sku: "กรุณากรอกรหัสสินค้า",
          name: "กรุณากรอกชื่อสินค้า",
          stock: "จำนวนเริ่มต้นต้องเป็นจำนวนเต็ม 0–1,000,000",
        },
      });
      const file = new File(["x"], "x.txt");
      const result = parseProductForm(form({ sku: file, name: file }), "create");
      expect(!result.success && Object.keys(result.errors).sort()).toEqual(["name", "sku"]);
    });
  });
});

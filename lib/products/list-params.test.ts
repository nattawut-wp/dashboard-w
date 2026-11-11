import { describe, expect, it } from "vitest";
import { buildProductListHref, parseProductListParams } from "./list-params";

describe("parseProductListParams", () => {
  it("อ่านคำค้น ตัวกรองสต็อก และหน้า", () => {
    expect(parseProductListParams({ q: " เสื้อ ", stock: "LOW", page: "2" })).toEqual({
      q: "เสื้อ",
      stock: "LOW",
      page: 2,
    });
  });

  it("ไม่มีค่า / ตัวกรองที่ไม่รู้จัก / ตัวพิมพ์เล็ก / toString / ค่าซ้ำใน URL → ค่าเริ่มต้น หรือค่าแรก", () => {
    expect(parseProductListParams({})).toEqual({ q: "", stock: null, page: 1 });
    for (const stock of ["low", "ALL", "", "toString"]) {
      expect(parseProductListParams({ stock }).stock).toBeNull();
    }
    expect(parseProductListParams({ stock: ["OUT", "LOW"] }).stock).toBe("OUT");
  });
});

describe("buildProductListHref", () => {
  it("ใส่เฉพาะค่าที่ไม่ใช่ค่าเริ่มต้น และเข้ารหัสภาษาไทยในลิงก์", () => {
    expect(buildProductListHref({ q: "", stock: null, page: 1 })).toBe("/products");
    expect(buildProductListHref({ q: "", stock: "OUT", page: 1 })).toBe("/products?stock=OUT");
    expect(buildProductListHref({ q: "เสื้อ ดำ", stock: "LOW", page: 3 })).toBe(
      "/products?q=%E0%B9%80%E0%B8%AA%E0%B8%B7%E0%B9%89%E0%B8%AD+%E0%B8%94%E0%B8%B3&stock=LOW&page=3",
    );
  });
});

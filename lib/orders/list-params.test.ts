import { describe, expect, it } from "vitest";
import { buildOrderListHref, paginate, parseOrderListParams } from "./list-params";

describe("buildOrderListHref", () => {
  it("ค่าเริ่มต้นทั้งหมด → /orders เฉยๆ", () => {
    expect(buildOrderListHref({ q: "", status: null, page: 1 })).toBe("/orders");
  });

  it("ใส่เฉพาะค่าที่ไม่ใช่ค่าเริ่มต้น และอ่านกลับได้ค่าเดิม", () => {
    expect(buildOrderListHref({ q: "", status: "PAID", page: 2 })).toBe("/orders?status=PAID&page=2");
    expect(buildOrderListHref({ q: "a&b", status: null, page: 1 })).toBe("/orders?q=a%26b");

    const params = { q: "สมชาย ใจดี", status: "SHIPPED" as const, page: 3 };
    const query = new URLSearchParams(buildOrderListHref(params).split("?")[1]);
    expect(parseOrderListParams(Object.fromEntries(query))).toEqual(params);
  });
});

describe("paginate (หน้าละ 20)", () => {
  it("45 รายการ หน้า 2 → 3 หน้า, ข้าม 20, เอา 20", () => {
    expect(paginate(45, 2)).toEqual({ page: 2, totalPages: 3, skip: 20, take: 20 });
  });

  describe("กรณีขอบ", () => {
    it("ไม่มีออร์เดอร์เลย → 1 หน้า (หน้าว่าง)", () => {
      expect(paginate(0, 1)).toEqual({ page: 1, totalPages: 1, skip: 0, take: 20 });
    });

    it("ขอหน้าเกินจำนวนหน้า → ไปหน้าสุดท้าย", () => {
      expect(paginate(45, 99)).toEqual({ page: 3, totalPages: 3, skip: 40, take: 20 });
      expect(paginate(0, 5)).toEqual({ page: 1, totalPages: 1, skip: 0, take: 20 });
    });

    it("พอดี 20 → 1 หน้า / 21 → 2 หน้า", () => {
      expect(paginate(20, 1).totalPages).toBe(1);
      expect(paginate(21, 1).totalPages).toBe(2);
    });
  });
});

describe("parseOrderListParams", () => {
  it("ไม่มีค่าใน URL → ค่าเริ่มต้น", () => {
    expect(parseOrderListParams({})).toEqual({ q: "", status: null, page: 1 });
  });

  it("ค่าที่ถูกต้อง → อ่านได้ (คำค้นตัดช่องว่าง)", () => {
    expect(parseOrderListParams({ q: "  สมชาย ", status: "PAID", page: "3" })).toEqual({
      q: "สมชาย",
      status: "PAID",
      page: 3,
    });
  });

  it("สถานะที่ไม่มีจริง / ตัวเล็ก / ว่าง → ไม่กรอง (null)", () => {
    for (const status of ["REFUNDED", "paid", "", "toString"]) {
      expect(parseOrderListParams({ status }).status).toBeNull();
    }
  });

  it("เลขหน้าผิด → หน้า 1", () => {
    for (const page of ["0", "-1", "1.5", "abc", "", "1e3", " 2", "02", "99999999999999999999"]) {
      expect(parseOrderListParams({ page }).page).toBe(1);
    }
  });

  it("ค่าซ้ำใน URL (array) → ใช้ค่าแรก, คำค้นยาวเกิน 100 → ตัดเหลือ 100", () => {
    expect(parseOrderListParams({ q: ["a", "b"], status: ["PAID", "X"], page: ["2", "5"] })).toEqual({
      q: "a",
      status: "PAID",
      page: 2,
    });
    expect(parseOrderListParams({ q: "ก".repeat(150) }).q).toHaveLength(100);
  });
});

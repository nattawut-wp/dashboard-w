import { describe, expect, it } from "vitest";
import { buildShippingHref, parseShippingListParams } from "./list-params";

describe("parseShippingListParams", () => {
  it("อ่านแท็บ คำค้น หน้า / ค่าผิดหรือไม่มี → แท็บรอส่ง หน้า 1", () => {
    expect(parseShippingListParams({ tab: "SHIPPED", q: " สมชาย ", page: "2" })).toEqual({
      tab: "SHIPPED",
      q: "สมชาย",
      page: 2,
    });
    expect(parseShippingListParams({ tab: "COD" }).tab).toBe("COD");
    for (const tab of [undefined, "", "shipped", "PAID", "toString", "cod"]) {
      expect(parseShippingListParams({ tab })).toEqual({ tab: "PENDING", q: "", page: 1 });
    }
  });
});

describe("buildShippingHref", () => {
  it("แท็บรอส่ง / หน้า 1 / ไม่มีคำค้น = ค่าเริ่มต้น ไม่ใส่ในลิงก์", () => {
    expect(buildShippingHref({ tab: "PENDING", q: "", page: 1 })).toBe("/shipping");
    expect(buildShippingHref({ tab: "SHIPPED", q: "", page: 1 })).toBe("/shipping?tab=SHIPPED");
    expect(buildShippingHref({ tab: "SHIPPED", q: "kex", page: 3 })).toBe("/shipping?tab=SHIPPED&q=kex&page=3");
    expect(buildShippingHref({ tab: "COD", q: "", page: 1 })).toBe("/shipping?tab=COD");
  });
});

describe("วันที่ในปฏิทิน (?date= / ?month=)", () => {
  it("อ่านวันที่/เดือนที่ถูกต้อง / ค่าผิด → ไม่กรอง (undefined)", () => {
    const params = parseShippingListParams({ tab: "SHIPPED", date: "2026-11-11", month: "2026-10" });
    expect(params.date).toBe("2026-11-11");
    expect(params.month).toBe("2026-10");
    const bad = parseShippingListParams({ date: "2026-02-30", month: "2026-13" });
    expect(bad.date).toBeUndefined();
    expect(bad.month).toBeUndefined();
  });

  it("ลิงก์เก็บวันที่และเดือนไว้ / ไม่มี = ไม่ใส่", () => {
    expect(buildShippingHref({ tab: "PENDING", q: "", page: 1, date: "2026-11-11" })).toBe("/shipping?date=2026-11-11");
    expect(buildShippingHref({ tab: "COD", q: "a", page: 2, date: "2026-11-11", month: "2026-12" })).toBe(
      "/shipping?tab=COD&q=a&page=2&date=2026-11-11&month=2026-12",
    );
  });
});

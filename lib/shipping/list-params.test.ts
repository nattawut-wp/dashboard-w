import { describe, expect, it } from "vitest";
import { buildShippingHref, parseShippingListParams } from "./list-params";

describe("parseShippingListParams", () => {
  it("อ่านแท็บ คำค้น หน้า / ค่าผิดหรือไม่มี → แท็บรอส่ง หน้า 1", () => {
    expect(parseShippingListParams({ tab: "SHIPPED", q: " สมชาย ", page: "2" })).toEqual({
      tab: "SHIPPED",
      q: "สมชาย",
      page: 2,
    });
    for (const tab of [undefined, "", "shipped", "PAID", "toString"]) {
      expect(parseShippingListParams({ tab })).toEqual({ tab: "PENDING", q: "", page: 1 });
    }
  });
});

describe("buildShippingHref", () => {
  it("แท็บรอส่ง / หน้า 1 / ไม่มีคำค้น = ค่าเริ่มต้น ไม่ใส่ในลิงก์", () => {
    expect(buildShippingHref({ tab: "PENDING", q: "", page: 1 })).toBe("/shipping");
    expect(buildShippingHref({ tab: "SHIPPED", q: "", page: 1 })).toBe("/shipping?tab=SHIPPED");
    expect(buildShippingHref({ tab: "SHIPPED", q: "kex", page: 3 })).toBe("/shipping?tab=SHIPPED&q=kex&page=3");
  });
});

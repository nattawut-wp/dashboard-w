import { describe, expect, it } from "vitest";
import { parseOrderId } from "./order-id";

describe("parseOrderId", () => {
  it("เลขจำนวนเต็มบวก → ตัวเลข", () => {
    expect(parseOrderId("12")).toBe(12);
    expect(parseOrderId("2147483647")).toBe(2147483647); // สูงสุดของ int ใน Postgres
  });

  it("กรณีขอบ: 0 / ติดลบ / ทศนิยม / ตัวอักษร / ว่าง / เกิน int / 0 นำหน้า → null", () => {
    for (const value of ["0", "-1", "1.5", "abc", "", "2147483648", "012", " 1", "1e3"]) {
      expect(parseOrderId(value)).toBeNull();
    }
  });
});

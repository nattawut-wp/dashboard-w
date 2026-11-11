import { describe, expect, it } from "vitest";
import { phoneSearchDigits } from "./list-params";

describe("phoneSearchDigits (ตัวเลขที่ใช้ค้นเบอร์โทร)", () => {
  it("บั๊ก: คำค้นที่มีตัวเลขปนแค่ 1–2 ตัว (เช่น 'QA COD1') ต้องไม่ไปค้นเบอร์โทร ไม่งั้นเจอทุกเบอร์ที่มีเลข 1", () => {
    expect(phoneSearchDigits("QA COD1")).toBe("");
    expect(phoneSearchDigits("ร้าน 99")).toBe("");
  });

  it("ค้นเบอร์ตามปกติยังได้: 3 ตัวขึ้นไป (ตัดขีด/ช่องว่าง) / ว่าง → ''", () => {
    expect(phoneSearchDigits("081-374")).toBe("081374");
    expect(phoneSearchDigits("081")).toBe("081");
    expect(phoneSearchDigits("")).toBe("");
    expect(phoneSearchDigits("สมชาย")).toBe("");
  });
});

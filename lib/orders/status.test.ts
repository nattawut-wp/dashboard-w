import { describe, expect, it } from "vitest";
import { ORDER_STATUSES, statusLabel } from "./status";

describe("statusLabel", () => {
  it("แปลงทุกสถานะเป็นภาษาไทย", () => {
    expect(ORDER_STATUSES.map(statusLabel)).toEqual(["รอชำระ", "ชำระแล้ว", "จัดส่งแล้ว", "ยกเลิก"]);
  });

  it("สถานะที่ไม่รู้จัก / ว่าง → 'ไม่ทราบสถานะ'", () => {
    expect(statusLabel("REFUNDED")).toBe("ไม่ทราบสถานะ");
    expect(statusLabel("")).toBe("ไม่ทราบสถานะ");
    expect(statusLabel("toString")).toBe("ไม่ทราบสถานะ");
  });
});

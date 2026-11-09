import { describe, expect, it } from "vitest";
import { newOrderFormDefaults, orderToFormDefaults } from "./form-defaults";

describe("orderToFormDefaults (หน้าแก้ไข)", () => {
  it("ออร์เดอร์ → ค่าในฟอร์ม, null → ข้อความว่าง, วันที่เป็นเวลาไทย", () => {
    expect(
      orderToFormDefaults({
        id: 7,
        customerName: "มาลี",
        customerPhone: null,
        total: "1250.50",
        status: "SHIPPED",
        orderedAt: new Date("2026-11-08T17:05:00Z"),
        note: null,
      }),
    ).toEqual({
      customerName: "มาลี",
      customerPhone: "",
      total: "1250.50",
      status: "SHIPPED",
      orderedAt: "2026-11-09T00:05",
      note: "",
    });
  });
});

describe("newOrderFormDefaults (หน้าเพิ่ม)", () => {
  it("ฟอร์มว่าง สถานะ 'รอชำระ' วันที่ = ตอนนี้ (เวลาไทย)", () => {
    expect(newOrderFormDefaults(new Date("2026-11-09T10:00:00Z"))).toEqual({
      customerName: "",
      customerPhone: "",
      total: "",
      status: "PENDING",
      orderedAt: "2026-11-09T17:00",
      note: "",
    });
  });
});

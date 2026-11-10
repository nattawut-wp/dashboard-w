import { describe, expect, it } from "vitest";
import { shipmentBlocker } from "./rules";

const ADDRESS = "45 หมู่ 3 นนทบุรี 11120";

describe("shipmentBlocker (null = ทำได้, ข้อความ = เหตุผลที่ทำไม่ได้)", () => {
  it("บันทึกส่ง: ชำระแล้ว + มีที่อยู่ → ทำได้", () => {
    expect(shipmentBlocker({ status: "PAID", shippingAddress: ADDRESS }, "ship")).toBeNull();
  });

  it("บันทึกส่ง: สถานะอื่น → บอกเหตุผลตามสถานะ", () => {
    const ship = (status: "PENDING" | "SHIPPED" | "CANCELLED") =>
      shipmentBlocker({ status, shippingAddress: ADDRESS }, "ship");
    expect(ship("PENDING")).toBe("ยังไม่ได้ชำระเงิน — เปลี่ยนสถานะเป็น “ชำระแล้ว” ก่อน");
    expect(ship("SHIPPED")).toBe("ออร์เดอร์นี้บันทึกการจัดส่งไปแล้ว");
    expect(ship("CANCELLED")).toBe("ออร์เดอร์นี้ถูกยกเลิกแล้ว");
  });

  it("บันทึกส่ง: ไม่มีที่อยู่ / ที่อยู่มีแต่ช่องว่าง → ต้องเพิ่มที่อยู่ก่อน", () => {
    for (const shippingAddress of [null, "", "   "]) {
      expect(shipmentBlocker({ status: "PAID", shippingAddress }, "ship")).toBe(
        "ยังไม่มีที่อยู่จัดส่ง — แก้ไขออร์เดอร์เพื่อเพิ่มที่อยู่ก่อน",
      );
    }
  });

  it("แก้เลขพัสดุ / ย้อนกลับเป็นรอส่ง: ได้เฉพาะออร์เดอร์ที่ส่งแล้ว", () => {
    for (const action of ["update", "revert"] as const) {
      expect(shipmentBlocker({ status: "SHIPPED", shippingAddress: ADDRESS }, action)).toBeNull();
      for (const status of ["PENDING", "PAID", "CANCELLED"] as const) {
        expect(shipmentBlocker({ status, shippingAddress: ADDRESS }, action)).toBe("ออร์เดอร์นี้ยังไม่ได้บันทึกการจัดส่ง");
      }
    }
  });
});

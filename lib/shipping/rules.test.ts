import { describe, expect, it } from "vitest";
import { revertedStatus, shipmentBlocker } from "./rules";

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

describe("shipmentBlocker — เก็บเงินปลายทาง (COD)", () => {
  const cod = (status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED", codCollectedAt: Date | null = null) => ({
    status,
    shippingAddress: ADDRESS,
    paymentMethod: "COD" as const,
    codCollectedAt,
  });

  it("บันทึกส่ง: COD ที่ยังรอชำระ → ส่งได้ (เก็บเงินตอนส่ง)", () => {
    expect(shipmentBlocker(cod("PENDING"), "ship")).toBeNull();
    expect(shipmentBlocker(cod("PAID"), "ship")).toBeNull();
  });

  it("ได้รับเงินแล้ว / ตีกลับ: COD ที่ส่งแล้วและยังไม่ได้เงิน → ทำได้", () => {
    expect(shipmentBlocker(cod("SHIPPED"), "collect")).toBeNull();
    expect(shipmentBlocker(cod("SHIPPED"), "return")).toBeNull();
  });

  it("ได้รับเงินแล้ว / ตีกลับ: ยังไม่ส่ง / ได้เงินแล้ว / โอนเงิน → บอกเหตุผล", () => {
    for (const action of ["collect", "return"] as const) {
      expect(shipmentBlocker(cod("PENDING"), action)).toBe("ออร์เดอร์นี้ยังไม่ได้บันทึกการจัดส่ง");
      expect(shipmentBlocker(cod("SHIPPED", new Date()), action)).toBe("บันทึกว่าได้รับเงินปลายทางแล้ว");
      expect(
        shipmentBlocker({ status: "SHIPPED", shippingAddress: ADDRESS, paymentMethod: "TRANSFER" }, action),
      ).toBe("ใช้ได้เฉพาะออร์เดอร์เก็บเงินปลายทาง");
    }
  });

  it("ย้อนกลับเป็นรอส่ง: ได้รับเงิน COD แล้ว → ย้อนไม่ได้", () => {
    expect(shipmentBlocker(cod("SHIPPED"), "revert")).toBeNull();
    expect(shipmentBlocker(cod("SHIPPED", new Date()), "revert")).toBe("บันทึกว่าได้รับเงินปลายทางแล้ว");
  });
});

describe("revertedStatus (สถานะหลังย้อนกลับเป็นรอส่ง)", () => {
  it("โอนเงิน → ชำระแล้ว / COD → รอชำระ (ยังไม่ได้เก็บเงิน)", () => {
    expect(revertedStatus("TRANSFER")).toBe("PAID");
    expect(revertedStatus("COD")).toBe("PENDING");
  });
});

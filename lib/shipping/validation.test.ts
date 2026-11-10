import { describe, expect, it } from "vitest";
import { parseShipmentForm } from "./validation";

describe("parseShipmentForm", () => {
  it("ขนส่ง + เลขพัสดุ → ข้อมูลพร้อมบันทึก", () => {
    expect(parseShipmentForm({ carrier: "KERRY", trackingNumber: "KEX1234567890" })).toEqual({
      success: true,
      data: { carrier: "KERRY", trackingNumber: "KEX1234567890" },
    });
  });

  it("ขนส่งไม่ถูกต้อง / ว่าง / null / ตัวเล็ก / toString → 'กรุณาเลือกขนส่ง'", () => {
    for (const carrier of ["DHL", "", null, "kerry", "toString"]) {
      expect(parseShipmentForm({ carrier, trackingNumber: "KEX1234567890" })).toEqual({
        success: false,
        errors: { carrier: "กรุณาเลือกขนส่ง" },
      });
    }
  });

  describe("เลขพัสดุ", () => {
    const tracking = (trackingNumber: unknown) => {
      const result = parseShipmentForm({ carrier: "FLASH", trackingNumber });
      return result.success ? result.data.trackingNumber : result.errors.trackingNumber;
    };

    it("ตัดช่องว่าง/ขีด + ตัวพิมพ์ใหญ่ให้ (คัดลอกมาจากแอปขนส่งมักมีช่องว่าง)", () => {
      expect(tracking("  th 1234-5678-9012 ")).toBe("TH123456789012");
      expect(tracking("ey123456789th")).toBe("EY123456789TH");
    });

    it("ว่าง / null → 'กรุณากรอกเลขพัสดุ'", () => {
      for (const value of ["", "   ", null]) expect(tracking(value)).toBe("กรุณากรอกเลขพัสดุ");
    });

    it("สั้นกว่า 6 / ยาวกว่า 30 / มีอักขระอื่น → แจ้งรูปแบบ, 6 และ 30 ตัวพอดีผ่าน", () => {
      const message = "เลขพัสดุต้องเป็น A–Z หรือ 0–9 ยาว 6–30 ตัว";
      for (const value of ["12345", "A".repeat(31), "TH12#456", "เลข123456"]) {
        expect(tracking(value)).toBe(message);
      }
      expect(tracking("123456")).toBe("123456");
      expect(tracking("A".repeat(30))).toBe("A".repeat(30));
    });
  });

  it("ผิดทั้งสองช่อง → แจ้งพร้อมกัน", () => {
    expect(parseShipmentForm({ carrier: "", trackingNumber: "" })).toEqual({
      success: false,
      errors: { carrier: "กรุณาเลือกขนส่ง", trackingNumber: "กรุณากรอกเลขพัสดุ" },
    });
  });
});

import { describe, expect, it } from "vitest";
import { parseNewAdminForm } from "./new-admin";

const valid = { name: " สมชาย ใจดี ", email: "Staff@Shop.com", password: "password1", confirmPassword: "password1" };

describe("parseNewAdminForm", () => {
  it("กรอกครบ → ผ่าน (อีเมลเป็นตัวเล็ก, ตัดช่องว่างชื่อ)", () => {
    expect(parseNewAdminForm(valid)).toEqual({
      success: true,
      data: { name: "สมชาย ใจดี", email: "staff@shop.com", password: "password1" },
    });
  });

  it("ยืนยันรหัสผ่านไม่ตรง → error ที่ช่องยืนยัน", () => {
    expect(parseNewAdminForm({ ...valid, confirmPassword: "password2" })).toEqual({
      success: false,
      errors: { confirmPassword: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" },
    });
  });

  it("ชื่อว่าง/มีแต่ช่องว่าง/ไม่ส่งมา (null) → ใช้ส่วนหน้า @ ของอีเมล", () => {
    for (const name of ["", "   ", null]) {
      const result = parseNewAdminForm({ ...valid, name });
      expect(result.success && result.data.name).toBe("staff");
    }
  });

  describe("กรณีขอบ", () => {
    const withPassword = (password: string | null) => ({ ...valid, password, confirmPassword: password });

    it("รหัสผ่าน 7 ตัว → ไม่ผ่าน / 8 ตัวพอดี → ผ่าน / 128 ผ่าน / 129 ยาวเกิน", () => {
      expect(parseNewAdminForm(withPassword("1234567"))).toEqual({
        success: false,
        errors: { password: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" },
      });
      expect(parseNewAdminForm(withPassword("12345678")).success).toBe(true);
      expect(parseNewAdminForm(withPassword("a".repeat(128))).success).toBe(true);
      expect(parseNewAdminForm(withPassword("a".repeat(129)))).toEqual({
        success: false,
        errors: { password: "รหัสผ่านยาวเกินไป" },
      });
    });

    it("ไม่กรอกอะไรเลย (FormData ให้ null) → แจ้งทุกช่องที่ต้องกรอก", () => {
      expect(parseNewAdminForm({ name: null, email: null, password: null, confirmPassword: null })).toEqual({
        success: false,
        errors: {
          email: "กรุณากรอกอีเมล",
          password: "กรุณากรอกรหัสผ่าน",
          confirmPassword: "กรุณายืนยันรหัสผ่าน",
        },
      });
    });

    it("ชื่อ 50 ตัว → ผ่าน / 51 ตัว → ยาวเกิน", () => {
      expect(parseNewAdminForm({ ...valid, name: "ก".repeat(50) }).success).toBe(true);
      expect(parseNewAdminForm({ ...valid, name: "ก".repeat(51) })).toEqual({
        success: false,
        errors: { name: "ชื่อยาวได้ไม่เกิน 50 ตัวอักษร" },
      });
    });
  });
});

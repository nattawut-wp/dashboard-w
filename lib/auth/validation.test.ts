import { describe, expect, it } from "vitest";
import { parseLoginInput } from "./validation";

describe("parseLoginInput", () => {
  it("ข้อมูลถูกต้อง → ผ่าน และอีเมลถูกตัดช่องว่าง/เป็นตัวเล็ก", () => {
    expect(parseLoginInput({ email: "  Admin@Shop.COM ", password: "secret123" })).toEqual({
      success: true,
      data: { email: "admin@shop.com", password: "secret123" },
    });
  });

  it("อีเมลว่าง → แจ้ง 'กรุณากรอกอีเมล'", () => {
    expect(parseLoginInput({ email: "", password: "secret123" })).toEqual({
      success: false,
      errors: { email: "กรุณากรอกอีเมล" },
    });
  });

  it("อีเมลรูปแบบผิด → แจ้ง 'รูปแบบอีเมลไม่ถูกต้อง'", () => {
    for (const email of ["admin@", "admin", "@shop.com", "admin@shop"]) {
      expect(parseLoginInput({ email, password: "secret123" })).toEqual({
        success: false,
        errors: { email: "รูปแบบอีเมลไม่ถูกต้อง" },
      });
    }
  });

  it("รหัสผ่านว่าง หรือ null → แจ้ง 'กรุณากรอกรหัสผ่าน'", () => {
    for (const password of ["", null]) {
      expect(parseLoginInput({ email: "admin@shop.com", password })).toEqual({
        success: false,
        errors: { password: "กรุณากรอกรหัสผ่าน" },
      });
    }
  });

  it("รหัสผ่านยาว 128 ตัวผ่าน แต่ 129 ตัว → แจ้ง 'รหัสผ่านยาวเกินไป'", () => {
    expect(parseLoginInput({ email: "admin@shop.com", password: "a".repeat(128) }).success).toBe(true);
    expect(parseLoginInput({ email: "admin@shop.com", password: "a".repeat(129) })).toEqual({
      success: false,
      errors: { password: "รหัสผ่านยาวเกินไป" },
    });
  });

  it("อีเมลเป็น null (ไม่มีช่องในฟอร์ม) → แจ้ง 'กรุณากรอกอีเมล'", () => {
    expect(parseLoginInput({ email: null, password: "secret123" })).toEqual({
      success: false,
      errors: { email: "กรุณากรอกอีเมล" },
    });
  });

  describe("กรณีขอบ", () => {
    it("ว่างทั้งคู่ → แจ้งทั้ง 2 ช่อง", () => {
      expect(parseLoginInput({ email: "", password: "" })).toEqual({
        success: false,
        errors: { email: "กรุณากรอกอีเมล", password: "กรุณากรอกรหัสผ่าน" },
      });
    });

    it("อีเมลมีแต่ช่องว่าง → ถือว่าว่าง", () => {
      expect(parseLoginInput({ email: "   ", password: "secret123" })).toEqual({
        success: false,
        errors: { email: "กรุณากรอกอีเมล" },
      });
    });

    it("รหัสผ่านไม่ถูกตัดช่องว่าง (ช่องว่างเป็นส่วนหนึ่งของรหัส)", () => {
      const result = parseLoginInput({ email: "admin@shop.com", password: " pass word " });
      expect(result).toEqual({
        success: true,
        data: { email: "admin@shop.com", password: " pass word " },
      });
    });

    it("ค่าที่ไม่ใช่ข้อความ (เช่น ไฟล์/ตัวเลข) → ไม่ผ่าน", () => {
      expect(parseLoginInput({ email: 123, password: {} })).toEqual({
        success: false,
        errors: { email: "กรุณากรอกอีเมล", password: "กรุณากรอกรหัสผ่าน" },
      });
    });
  });
});

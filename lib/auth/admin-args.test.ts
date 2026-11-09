import { describe, expect, it } from "vitest";
import { parseCreateAdminArgs } from "./admin-args";

describe("parseCreateAdminArgs", () => {
  it("อีเมล + รหัสผ่าน → ผ่าน, ชื่อใช้ส่วนหน้า @ ของอีเมล", () => {
    expect(parseCreateAdminArgs(["Owner@Shop.com", "password1"])).toEqual({
      success: true,
      data: { email: "owner@shop.com", password: "password1", name: "owner" },
    });
  });

  it("ใส่ชื่อมาด้วย → ใช้ชื่อนั้น (ตัดช่องว่างหน้า-หลัง)", () => {
    expect(parseCreateAdminArgs(["owner@shop.com", "password1", "  สมชาย ใจดี "])).toEqual({
      success: true,
      data: { email: "owner@shop.com", password: "password1", name: "สมชาย ใจดี" },
    });
  });

  it("ใส่ไม่ครบ → บอกวิธีใช้", () => {
    const usage = 'วิธีใช้: npm run create-admin -- <อีเมล> <รหัสผ่าน> ["ชื่อ"]';
    expect(parseCreateAdminArgs([])).toEqual({ success: false, error: usage });
    expect(parseCreateAdminArgs(["owner@shop.com"])).toEqual({ success: false, error: usage });
  });

  it("อีเมลผิดรูปแบบ → 'รูปแบบอีเมลไม่ถูกต้อง'", () => {
    expect(parseCreateAdminArgs(["owner@", "password1"])).toEqual({
      success: false,
      error: "รูปแบบอีเมลไม่ถูกต้อง",
    });
  });

  it("รหัสผ่าน 7 ตัว → ไม่ผ่าน, 8 ตัวพอดี → ผ่าน", () => {
    expect(parseCreateAdminArgs(["owner@shop.com", "1234567"])).toEqual({
      success: false,
      error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร",
    });
    expect(parseCreateAdminArgs(["owner@shop.com", "12345678"]).success).toBe(true);
  });

  describe("กรณีขอบ", () => {
    it("รหัสผ่าน 128 ตัว → ผ่าน, 129 ตัว → 'รหัสผ่านยาวเกินไป'", () => {
      expect(parseCreateAdminArgs(["owner@shop.com", "a".repeat(128)]).success).toBe(true);
      expect(parseCreateAdminArgs(["owner@shop.com", "a".repeat(129)])).toEqual({
        success: false,
        error: "รหัสผ่านยาวเกินไป",
      });
    });

    it("รหัสผ่านว่าง → แจ้งให้กรอก", () => {
      expect(parseCreateAdminArgs(["owner@shop.com", ""])).toEqual({
        success: false,
        error: "กรุณากรอกรหัสผ่าน",
      });
    });

    it("อีเมลว่าง → แจ้งให้กรอก", () => {
      expect(parseCreateAdminArgs(["", "password1"])).toEqual({
        success: false,
        error: "กรุณากรอกอีเมล",
      });
    });

    it("ชื่อมีแต่ช่องว่าง → ใช้ส่วนหน้า @ แทน", () => {
      expect(parseCreateAdminArgs(["owner@shop.com", "password1", "   "])).toEqual({
        success: true,
        data: { email: "owner@shop.com", password: "password1", name: "owner" },
      });
    });
  });

  it("เกิน 3 ค่า (ลืมใส่ \"\" ครอบชื่อที่มีช่องว่าง) → บอกวิธีใช้", () => {
    expect(parseCreateAdminArgs(["owner@shop.com", "password1", "สมชาย", "ใจดี"])).toEqual({
      success: false,
      error: 'วิธีใช้: npm run create-admin -- <อีเมล> <รหัสผ่าน> ["ชื่อ"]',
    });
  });
});

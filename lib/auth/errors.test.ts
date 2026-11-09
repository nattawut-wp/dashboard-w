import { describe, expect, it } from "vitest";
import { loginErrorMessage } from "./errors";

describe("loginErrorMessage", () => {
  it("อีเมลหรือรหัสผ่านผิด → 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'", () => {
    expect(loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    );
  });

  it("ลองบ่อยเกินไป (429) → ให้รอสักครู่", () => {
    expect(loginErrorMessage({ status: 429 })).toBe(
      "ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
    );
  });

  it("เซิร์ฟเวอร์ตอบว่าอีเมลผิดรูปแบบ → 'รูปแบบอีเมลไม่ถูกต้อง'", () => {
    expect(loginErrorMessage({ status: 400, code: "INVALID_EMAIL" })).toBe("รูปแบบอีเมลไม่ถูกต้อง");
  });

  it("ไม่มีข้อมูล error หรือ error ที่ไม่รู้จัก → ข้อความกลางๆ ให้ลองใหม่", () => {
    const generic = "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    expect(loginErrorMessage(null)).toBe(generic);
    expect(loginErrorMessage(undefined)).toBe(generic);
    expect(loginErrorMessage({})).toBe(generic);
    expect(loginErrorMessage({ status: 500, code: "INTERNAL_SERVER_ERROR" })).toBe(generic);
    expect(loginErrorMessage({ status: 0 })).toBe(generic); // เน็ตหลุด
  });

  describe("กรณีขอบ", () => {
    const generic = "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

    it("status ติดกับ 429 (428, 430) → ไม่ใช่ข้อความ 'บ่อยเกินไป'", () => {
      expect(loginErrorMessage({ status: 428 })).toBe(generic);
      expect(loginErrorMessage({ status: 430 })).toBe(generic);
    });

    it("429 มาก่อน code อื่นเสมอ", () => {
      expect(loginErrorMessage({ status: 429, code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
        "ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
      );
    });

    it("code ที่ไม่รู้จัก / code ว่าง → ข้อความกลางๆ", () => {
      expect(loginErrorMessage({ status: 400, code: "SOMETHING_NEW" })).toBe(generic);
      expect(loginErrorMessage({ status: 400, code: "" })).toBe(generic);
    });

    it("code ชื่อตรงกับ property ในตัวของ object (เช่น toString) → ยังได้ข้อความ ไม่ใช่ฟังก์ชัน", () => {
      expect(loginErrorMessage({ code: "toString" })).toBe(generic);
      expect(loginErrorMessage({ code: "constructor" })).toBe(generic);
    });
  });
});

import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("ไม่มีค่า (null) → ไปหน้า /dashboard", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
  });

  it("path ภายในเว็บ → ใช้ตามนั้น", () => {
    expect(safeRedirectPath("/orders")).toBe("/orders");
  });

  it("URL เว็บอื่น → ไม่ยอม ไปหน้า /dashboard", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
  });

  it("ขึ้นต้นด้วย // (เบราว์เซอร์มองเป็นเว็บอื่น) → ไม่ยอม", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
  });

  it("มี backslash (เบราว์เซอร์แปลงเป็น /) → ไม่ยอม", () => {
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
  });

  it("หน้า /login เอง (จะวนกลับมาที่ login) → ไปหน้า /dashboard", () => {
    expect(safeRedirectPath("/login")).toBe("/dashboard");
    expect(safeRedirectPath("/login?next=/orders")).toBe("/dashboard");
  });

  it("มีช่องว่าง/อักขระควบคุม (เบราว์เซอร์ตัดทิ้งแล้วกลายเป็น //) → ไม่ยอม", () => {
    expect(safeRedirectPath("/\t/evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\n/evil.com")).toBe("/dashboard");
    expect(safeRedirectPath(" /orders")).toBe("/dashboard");
  });

  it("path ของ API (ไม่ใช่หน้าเว็บ) → ไม่ยอม", () => {
    expect(safeRedirectPath("/api/auth/sign-out")).toBe("/dashboard");
    expect(safeRedirectPath("/api")).toBe("/dashboard");
  });

  describe("กรณีขอบ", () => {
    it("ค่าว่าง / undefined → ไปหน้า /dashboard", () => {
      expect(safeRedirectPath("")).toBe("/dashboard");
      expect(safeRedirectPath(undefined)).toBe("/dashboard");
    });

    it("path ไม่มี / นำหน้า → ไม่ยอม", () => {
      expect(safeRedirectPath("orders")).toBe("/dashboard");
    });

    it("เก็บ query string ไว้", () => {
      expect(safeRedirectPath("/orders?status=PAID&page=2")).toBe("/orders?status=PAID&page=2");
    });

    it("path ที่แค่ขึ้นต้นคล้าย /login หรือ /api ยังใช้ได้", () => {
      expect(safeRedirectPath("/login-history")).toBe("/login-history");
      expect(safeRedirectPath("/apis")).toBe("/apis");
    });

    it("แค่ / → ใช้ได้", () => {
      expect(safeRedirectPath("/")).toBe("/");
    });
  });
});

import { describe, expect, it } from "vitest";
import { deleteAdminBlocker } from "./delete-admin";

describe("deleteAdminBlocker", () => {
  it("ลบบัญชีตัวเอง → ไม่ได้", () => {
    expect(deleteAdminBlocker({ targetId: "me", currentUserId: "me", adminCount: 3 })).toBe(
      "ลบบัญชีของตัวเองไม่ได้",
    );
  });

  it("เหลือผู้ดูแลคนเดียว (หรือนับได้ 0/ติดลบ) → ไม่ได้ / 2 คนขึ้นไปและไม่ใช่ตัวเอง → ได้", () => {
    const last = "ต้องมีผู้ดูแลเหลืออย่างน้อย 1 คน";
    for (const adminCount of [1, 0, -1]) {
      expect(deleteAdminBlocker({ targetId: "other", currentUserId: "me", adminCount })).toBe(last);
    }
    expect(deleteAdminBlocker({ targetId: "other", currentUserId: "me", adminCount: 2 })).toBeNull();
  });
});

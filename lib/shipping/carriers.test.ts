import { describe, expect, it } from "vitest";
import { CARRIERS, carrierLabel } from "./carriers";

describe("carrierLabel", () => {
  it("ชื่อขนส่งที่แสดงบนหน้าจอ ครบทุกตัว / ไม่มีหรือไม่รู้จัก → '—'", () => {
    expect(CARRIERS.map(carrierLabel)).toEqual(["Kerry Express", "Flash Express", "J&T Express", "ไปรษณีย์ไทย", "อื่นๆ"]);
    expect(carrierLabel(null)).toBe("—");
    expect(carrierLabel("DHL")).toBe("—");
    expect(carrierLabel("toString")).toBe("—");
  });
});

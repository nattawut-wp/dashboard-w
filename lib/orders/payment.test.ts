import { describe, expect, it } from "vitest";
import { PAYMENT_METHODS, paymentMethodLabel } from "./payment";

describe("paymentMethodLabel", () => {
  it("ภาษาไทยครบทุกวิธี / ไม่รู้จัก → '—'", () => {
    expect(PAYMENT_METHODS.map(paymentMethodLabel)).toEqual(["โอนเงิน", "เก็บเงินปลายทาง (COD)"]);
    expect(paymentMethodLabel("CASH")).toBe("—");
    expect(paymentMethodLabel("toString")).toBe("—");
  });
});

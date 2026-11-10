import { describe, expect, it } from "vitest";
import { codPaymentState, PAYMENT_METHODS, paymentMethodLabel } from "./payment";

describe("paymentMethodLabel", () => {
  it("ภาษาไทยครบทุกวิธี / ไม่รู้จัก → '—'", () => {
    expect(PAYMENT_METHODS.map(paymentMethodLabel)).toEqual(["โอนเงิน", "เก็บเงินปลายทาง (COD)"]);
    expect(paymentMethodLabel("CASH")).toBe("—");
    expect(paymentMethodLabel("toString")).toBe("—");
  });
});

describe("codPaymentState (ป้ายเงิน COD)", () => {
  const order = (status: "PENDING" | "PAID" | "SHIPPED" | "CANCELLED", codCollectedAt: Date | null = null) => ({
    paymentMethod: "COD" as const,
    status,
    codCollectedAt,
  });

  it("COD ส่งแล้ว: ยังไม่ได้เงิน → 'WAITING' / ได้เงินแล้ว → 'COLLECTED'", () => {
    expect(codPaymentState(order("SHIPPED"))).toBe("WAITING");
    expect(codPaymentState(order("SHIPPED", new Date()))).toBe("COLLECTED");
  });

  it("โอนเงิน / COD ที่ยังไม่ส่ง / COD ยกเลิก(ตีกลับ) → null (ไม่มีป้ายเงิน)", () => {
    expect(codPaymentState({ paymentMethod: "TRANSFER", status: "SHIPPED", codCollectedAt: null })).toBeNull();
    expect(codPaymentState(order("PENDING"))).toBeNull();
    expect(codPaymentState(order("CANCELLED"))).toBeNull();
  });
});

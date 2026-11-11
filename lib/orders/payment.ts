import { PaymentMethod } from "@/generated/prisma/enums";

/** ลำดับในตัวเลือก (โอนเงินเป็นค่าเริ่มต้น) */
export const PAYMENT_METHODS = [PaymentMethod.TRANSFER, PaymentMethod.COD] as const satisfies readonly PaymentMethod[];

const LABELS = new Map<string, string>([
  [PaymentMethod.TRANSFER, "โอนเงิน"],
  [PaymentMethod.COD, "เก็บเงินปลายทาง (COD)"],
]);

export function paymentMethodLabel(method: string): string {
  return LABELS.get(method) ?? "—";
}

/** WAITING = ส่งแล้วรอขนส่งโอนเงิน, COLLECTED = ได้รับเงินแล้ว */
export type CodPaymentState = "WAITING" | "COLLECTED";

/** สถานะเงินของออร์เดอร์ COD ที่ส่งแล้ว — อย่างอื่นไม่มีป้ายเงิน (null) */
export function codPaymentState(order: {
  paymentMethod: PaymentMethod;
  status: string;
  codCollectedAt: Date | null;
}): CodPaymentState | null {
  if (order.paymentMethod !== "COD" || order.status !== "SHIPPED") return null;
  return order.codCollectedAt ? "COLLECTED" : "WAITING";
}

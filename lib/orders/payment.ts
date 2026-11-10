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

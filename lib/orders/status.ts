import { OrderStatus } from "@/generated/prisma/enums";

export { OrderStatus };

/** ลำดับสถานะตามขั้นตอนจริง (ใช้เรียงในตัวเลือก/ตัวกรอง) */
export const ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.SHIPPED,
  OrderStatus.CANCELLED,
] as const satisfies readonly OrderStatus[];

const LABELS = new Map<string, string>([
  [OrderStatus.PENDING, "รอชำระ"],
  [OrderStatus.PAID, "ชำระแล้ว"],
  [OrderStatus.SHIPPED, "จัดส่งแล้ว"],
  [OrderStatus.CANCELLED, "ยกเลิก"],
]);

export function statusLabel(status: string): string {
  return LABELS.get(status) ?? "ไม่ทราบสถานะ";
}

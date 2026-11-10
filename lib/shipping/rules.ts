import type { OrderStatus } from "@/lib/orders/status";

/** ship = บันทึกการจัดส่ง, update = แก้ขนส่ง/เลขพัสดุ, revert = ย้อนกลับเป็นรอส่ง */
export type ShipmentAction = "ship" | "update" | "revert";

const CANNOT_SHIP: Partial<Record<OrderStatus, string>> = {
  PENDING: "ยังไม่ได้ชำระเงิน — เปลี่ยนสถานะเป็น “ชำระแล้ว” ก่อน",
  SHIPPED: "ออร์เดอร์นี้บันทึกการจัดส่งไปแล้ว",
  CANCELLED: "ออร์เดอร์นี้ถูกยกเลิกแล้ว",
};

/**
 * ออร์เดอร์นี้ทำ `action` ได้ไหม — null = ได้, ข้อความ = เหตุผลที่ไม่ได้ (แสดงให้ผู้ใช้เห็น)
 * - บันทึกส่ง: ต้องชำระแล้ว และมีที่อยู่จัดส่ง
 * - แก้เลขพัสดุ / ย้อนกลับ: ต้องส่งแล้ว
 */
export function shipmentBlocker(
  order: { status: OrderStatus; shippingAddress: string | null },
  action: ShipmentAction,
): string | null {
  if (action !== "ship") {
    return order.status === "SHIPPED" ? null : "ออร์เดอร์นี้ยังไม่ได้บันทึกการจัดส่ง";
  }
  if (order.status !== "PAID") return CANNOT_SHIP[order.status] ?? null;
  if (!order.shippingAddress?.trim()) return "ยังไม่มีที่อยู่จัดส่ง — แก้ไขออร์เดอร์เพื่อเพิ่มที่อยู่ก่อน";
  return null;
}

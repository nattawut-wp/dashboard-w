import type { PaymentMethod } from "@/generated/prisma/enums";
import type { OrderStatus } from "@/lib/orders/status";

/**
 * ship = บันทึกการจัดส่ง, update = แก้ขนส่ง/เลขพัสดุ, revert = ย้อนกลับเป็นรอส่ง
 * collect = ได้รับเงินปลายทางแล้ว (COD), return = พัสดุตีกลับ (COD)
 */
export type ShipmentAction = "ship" | "update" | "revert" | "collect" | "return";

export type ShipmentOrder = {
  status: OrderStatus;
  shippingAddress: string | null;
  /** ไม่ระบุ = โอนเงิน */
  paymentMethod?: PaymentMethod;
  codCollectedAt?: Date | null;
};

const CANNOT_SHIP: Partial<Record<OrderStatus, string>> = {
  PENDING: "ยังไม่ได้ชำระเงิน — เปลี่ยนสถานะเป็น “ชำระแล้ว” ก่อน",
  SHIPPED: "ออร์เดอร์นี้บันทึกการจัดส่งไปแล้ว",
  CANCELLED: "ออร์เดอร์นี้ถูกยกเลิกแล้ว",
};
const NOT_SHIPPED = "ออร์เดอร์นี้ยังไม่ได้บันทึกการจัดส่ง";
const COD_COLLECTED = "บันทึกว่าได้รับเงินปลายทางแล้ว";
const COD_ONLY = "ใช้ได้เฉพาะออร์เดอร์เก็บเงินปลายทาง";

/**
 * ออร์เดอร์นี้ทำ `action` ได้ไหม — null = ได้, ข้อความ = เหตุผลที่ไม่ได้ (แสดงให้ผู้ใช้เห็น)
 * - บันทึกส่ง: ชำระแล้ว (หรือ COD ที่รอชำระ — เก็บเงินตอนส่ง) และมีที่อยู่จัดส่ง
 * - แก้เลขพัสดุ: ส่งแล้ว
 * - ย้อนกลับ: ส่งแล้ว และ (ถ้า COD) ยังไม่ได้เงิน
 * - ได้รับเงิน / ตีกลับ: COD ที่ส่งแล้วและยังไม่ได้เงิน
 */
export function shipmentBlocker(order: ShipmentOrder, action: ShipmentAction): string | null {
  const isCod = order.paymentMethod === "COD";

  if (action === "ship") {
    // COD เก็บเงินตอนส่ง → ยังไม่ชำระก็ส่งได้
    const readyToShip = order.status === "PAID" || (isCod && order.status === "PENDING");
    if (!readyToShip) return CANNOT_SHIP[order.status] ?? null;
    if (!order.shippingAddress?.trim()) return "ยังไม่มีที่อยู่จัดส่ง — แก้ไขออร์เดอร์เพื่อเพิ่มที่อยู่ก่อน";
    return null;
  }

  if ((action === "collect" || action === "return") && !isCod) return COD_ONLY;
  if (order.status !== "SHIPPED") return NOT_SHIPPED;
  if (action !== "update" && order.codCollectedAt) return COD_COLLECTED;
  return null;
}

/** ย้อนกลับเป็นรอส่ง → โอนเงินกลับเป็น "ชำระแล้ว", COD กลับเป็น "รอชำระ" (ยังไม่ได้เก็บเงิน) */
export function revertedStatus(paymentMethod: PaymentMethod): "PAID" | "PENDING" {
  return paymentMethod === "COD" ? "PENDING" : "PAID";
}

import { toBangkokDateTimeInput } from "./datetime";
import { formatThaiPhone } from "./format";
import { OrderStatus } from "./status";
import type { OrderRow } from "./types";
import type { ORDER_FIELDS } from "./validation";

export type OrderFormDefaults = Record<(typeof ORDER_FIELDS)[number], string>;

/** ค่าเริ่มต้นของฟอร์มหน้าแก้ไข */
export function orderToFormDefaults(order: OrderRow): OrderFormDefaults {
  return {
    customerName: order.customerName,
    customerPhone: order.customerPhone ? formatThaiPhone(order.customerPhone) : "",
    total: order.total,
    status: order.status,
    orderedAt: toBangkokDateTimeInput(order.orderedAt),
    note: order.note ?? "",
    shippingAddress: order.shippingAddress ?? "",
  };
}

/** ค่าเริ่มต้นของฟอร์มหน้าเพิ่ม — ส่วนใหญ่เพิ่งสั่งเข้ามา จึงตั้งเป็น "รอชำระ" และเวลาปัจจุบัน */
export function newOrderFormDefaults(now: Date): OrderFormDefaults {
  return {
    customerName: "",
    customerPhone: "",
    total: "",
    status: OrderStatus.PENDING,
    orderedAt: toBangkokDateTimeInput(now),
    note: "",
    shippingAddress: "",
  };
}

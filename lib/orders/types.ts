import type { OrderStatus } from "./status";

/** ออร์เดอร์ในรูปที่ส่งให้หน้าเว็บได้ (ยอดเงินเป็นข้อความ เพราะ Decimal ส่งเข้า Client Component ไม่ได้) */
export type OrderRow = {
  id: number;
  customerName: string;
  customerPhone: string | null;
  total: string;
  status: OrderStatus;
  orderedAt: Date;
  note: string | null;
};

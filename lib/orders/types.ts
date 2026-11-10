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

/** สินค้า 1 แถวในออร์เดอร์ (ชื่อ ณ ตอนที่ขาย) */
export type OrderItemRow = { productId: number; productName: string; quantity: number };

/** ตัวเลือกสินค้าในฟอร์มออร์เดอร์ */
export type ProductOption = { id: number; sku: string; name: string; stock: number; isActive: boolean };

/** สินค้าในรูปที่ส่งให้หน้าเว็บได้ (ราคาเป็นข้อความ เพราะ Decimal ส่งเข้า Client Component ไม่ได้) */
export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  price: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

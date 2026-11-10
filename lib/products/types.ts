/** สินค้าในรูปที่ส่งให้หน้าเว็บได้ */
export type ProductRow = {
  id: number;
  sku: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

import type { ProductRow } from "./types";
import type { PRODUCT_FIELDS } from "./validation";

export type ProductFormDefaults = Record<(typeof PRODUCT_FIELDS)[number], string>;

/** ค่าเริ่มต้นของฟอร์มหน้าแก้ไข — จำนวนคงเหลือไม่อยู่ในฟอร์ม (แก้ผ่าน "ปรับสต็อก") */
export function productToFormDefaults(product: ProductRow): ProductFormDefaults {
  return {
    sku: product.sku,
    name: product.name,
    price: product.price,
    lowStockThreshold: String(product.lowStockThreshold),
    stock: "",
  };
}

/** ค่าเริ่มต้นของฟอร์มหน้าเพิ่มสินค้า */
export function newProductFormDefaults(): ProductFormDefaults {
  return { sku: "", name: "", price: "", lowStockThreshold: "5", stock: "0" };
}

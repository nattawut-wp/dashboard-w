-- คลังสินค้าไม่เก็บราคา (ยอดรวมของออร์เดอร์กรอกเอง)
-- CHECK ที่ผูกกับคอลัมน์ (products_price_non_negative, order_items_unit_price_non_negative) ถูกลบตามคอลัมน์อัตโนมัติ

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "unitPrice";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "price";

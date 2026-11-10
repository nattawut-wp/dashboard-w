type Item = { productName: string; quantity: number };

const MAX_SHOWN = 2;

/**
 * สรุปสินค้าในออร์เดอร์ให้สั้นพอแสดงในรายการ (มือถือ)
 * "เสื้อ ×1, หมวก ×2 +อีก 2 รายการ" + จำนวนชิ้นรวม
 */
export function summarizeItems(items: Item[]): { text: string; totalQuantity: number } {
  const shown = items
    .slice(0, MAX_SHOWN)
    .map((item) => `${item.productName} ×${item.quantity.toLocaleString("th-TH")}`)
    .join(", ");
  const hidden = items.length - MAX_SHOWN;
  return {
    text: hidden > 0 ? `${shown} +อีก ${hidden} รายการ` : shown,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

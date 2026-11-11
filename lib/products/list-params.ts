import { buildHref, firstParam, parsePage, parseQuery, type SearchParams } from "@/lib/list-params";

/** LOW = ใกล้หมด, OUT = หมด, INACTIVE = เลิกขาย (ไม่เลือก = สินค้าที่ยังขายทั้งหมด) */
export const STOCK_FILTERS = ["LOW", "OUT", "INACTIVE"] as const;
export type StockFilter = (typeof STOCK_FILTERS)[number];

function isStockFilter(value: unknown): value is StockFilter {
  return STOCK_FILTERS.some((filter) => filter === value);
}
export type ProductListParams = { q: string; stock: StockFilter | null; page: number };

/** อ่านตัวกรองหน้าคลังสินค้าจาก URL (?q=&stock=&page=) — ค่าที่ผิดใช้ค่าเริ่มต้นแทน ไม่ทำให้หน้าพัง */
export function parseProductListParams(searchParams: SearchParams): ProductListParams {
  const stock = firstParam(searchParams.stock);
  return {
    q: parseQuery(searchParams.q),
    stock: isStockFilter(stock) ? stock : null,
    page: parsePage(searchParams.page),
  };
}

/** สร้างลิงก์หน้าคลังสินค้า (ปุ่มเปลี่ยนหน้า / ป้ายตัวกรอง) */
export function buildProductListHref({ q, stock, page }: ProductListParams): string {
  return buildHref("/products", { q, stock, page: page > 1 ? String(page) : null });
}

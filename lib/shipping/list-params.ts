import { buildHref, firstParam, parsePage, parseQuery, type SearchParams } from "@/lib/list-params";

/** PENDING = รอส่ง (ชำระแล้ว), SHIPPED = ส่งแล้ว */
export type ShippingTab = "PENDING" | "SHIPPED";
export type ShippingListParams = { tab: ShippingTab; q: string; page: number };

/** อ่านแท็บ/คำค้น/หน้าจาก URL (?tab=&q=&page=) — ค่าที่ผิดใช้ค่าเริ่มต้น (แท็บรอส่ง) */
export function parseShippingListParams(searchParams: SearchParams): ShippingListParams {
  return {
    tab: firstParam(searchParams.tab) === "SHIPPED" ? "SHIPPED" : "PENDING",
    q: parseQuery(searchParams.q),
    page: parsePage(searchParams.page),
  };
}

export function buildShippingHref({ tab, q, page }: ShippingListParams): string {
  return buildHref("/shipping", {
    tab: tab === "SHIPPED" ? tab : null,
    q,
    page: page > 1 ? String(page) : null,
  });
}

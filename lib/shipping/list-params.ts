import { buildHref, firstParam, parsePage, parseQuery, type SearchParams } from "@/lib/list-params";
import { parseDateKey, parseMonthKey } from "./calendar";

/** PENDING = รอส่ง, SHIPPED = ส่งแล้ว, COD = ส่งแล้วแต่ยังไม่ได้เงินปลายทาง */
export const SHIPPING_TABS = ["PENDING", "SHIPPED", "COD"] as const;
export type ShippingTab = (typeof SHIPPING_TABS)[number];
export type ShippingListParams = {
  tab: ShippingTab;
  q: string;
  page: number;
  /** วันที่กดในปฏิทิน "YYYY-MM-DD" (ไม่มี = ทุกวัน) */
  date?: string;
  /** เดือนที่ปฏิทินแสดง "YYYY-MM" (ไม่มี = เดือนของวันที่เลือก หรือเดือนนี้) */
  month?: string;
};

function isTab(value: unknown): value is ShippingTab {
  return SHIPPING_TABS.some((tab) => tab === value);
}

/** อ่านแท็บ/คำค้น/หน้า/วันที่จาก URL (?tab=&q=&page=&date=&month=) — ค่าที่ผิดใช้ค่าเริ่มต้น (แท็บรอส่ง) */
export function parseShippingListParams(searchParams: SearchParams): ShippingListParams {
  const tab = firstParam(searchParams.tab);
  return {
    tab: isTab(tab) ? tab : "PENDING",
    q: parseQuery(searchParams.q),
    page: parsePage(searchParams.page),
    date: parseDateKey(searchParams.date),
    month: parseMonthKey(searchParams.month),
  };
}

export function buildShippingHref({ tab, q, page, date, month }: ShippingListParams): string {
  return buildHref("/shipping", {
    tab: tab === "PENDING" ? null : tab,
    q,
    page: page > 1 ? String(page) : null,
    date,
    month,
  });
}

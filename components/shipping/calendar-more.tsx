"use client";

import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatOrderNumber } from "@/lib/orders/format";
import type { CalendarOrder } from "@/lib/shipping/data";
import { cn } from "@/lib/utils";

type Props = {
  /** เช่น "11 พฤศจิกายน 2569" */
  title: string;
  orders: CalendarOrder[];
  /** จำนวนที่ซ่อนอยู่: มือถือ / จอใหญ่ */
  mobileMore: number;
  desktopMore: number;
  /** ลิงก์กรองรายการด้านล่างให้เหลือวันนี้ */
  dayHref: string;
};

/** ปุ่ม "+N" / "อีก N" — กดแล้วเห็นชื่อทั้งหมดของวันนั้น (กดชื่อ = เปิดออร์เดอร์) */
export function CalendarMore({ title, orders, mobileMore, desktopMore, dayHref }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "relative z-10 rounded px-1 text-left text-[10px] font-medium text-emerald-700 hover:bg-emerald-100 hover:underline sm:text-xs dark:text-emerald-300 dark:hover:bg-emerald-900/50",
          desktopMore <= 0 && "sm:hidden",
        )}
        aria-label={`ดูชื่อทั้งหมด ${orders.length} ออร์เดอร์ ${title}`}
      >
        <span className="sm:hidden">+{mobileMore}</span>
        {desktopMore > 0 && <span className="hidden sm:inline">อีก {desktopMore}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <p className="px-1 pb-1 text-sm font-semibold">
          {title} · {orders.length} ออร์เดอร์
        </p>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}/edit`}
                className="flex gap-2 rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200"
              >
                <span className="shrink-0 tabular-nums opacity-70">{formatOrderNumber(order.id)}</span>
                <span className="truncate">{order.customerName}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={dayHref} className="mt-2 block px-1 text-xs text-primary underline-offset-2 hover:underline">
          ดูรายการจัดส่งของวันนี้ด้านล่าง
        </Link>
      </PopoverContent>
    </Popover>
  );
}

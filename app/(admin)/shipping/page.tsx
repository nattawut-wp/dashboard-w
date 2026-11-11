import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ListPagination } from "@/components/admin/list-pagination";
import { ShipmentCard } from "@/components/shipping/shipment-card";
import { ShippingCalendar } from "@/components/shipping/shipping-calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth/session";
import type { SearchParams } from "@/lib/list-params";
import { formatBaht, SHOP_TIME_ZONE } from "@/lib/orders/format";
import { cn } from "@/lib/utils";
import { bangkokDateKey } from "@/lib/dashboard/dates";
import { visibleMonth } from "@/lib/shipping/calendar";
import { countShipments, countShipmentsByDay, listShipments, TAB_DATE_FIELD } from "@/lib/shipping/data";
import {
  buildShippingHref,
  parseShippingListParams,
  type ShippingListParams,
  type ShippingTab,
} from "@/lib/shipping/list-params";

export const metadata: Metadata = { title: "จัดส่ง" };

export default function ShippingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">จัดส่ง</h1>
      {/* อ่าน URL + session + ฐานข้อมูล → อยู่ใน Suspense ให้หัวหน้าแสดงได้ทันที */}
      <Suspense fallback={<ShippingSkeleton />}>
        <ShippingContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ShippingContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await getCurrentUser();
  const params = parseShippingListParams(await searchParams);
  const now = new Date();
  const month = visibleMonth(params, now);
  const [{ orders, totalItems, page, totalPages }, { counts, codOutstanding }, dayCounts] = await Promise.all([
    listShipments(params),
    countShipments(),
    countShipmentsByDay(params.tab, month),
  ]);
  const dateLabel = DATE_LABELS[TAB_DATE_FIELD[params.tab]];
  const filtered = Boolean(params.q || params.date);

  return (
    <div className="space-y-4">
      <ShippingCalendar
        params={params}
        month={month}
        today={bangkokDateKey(now)}
        counts={dayCounts}
        dateLabel={dateLabel}
      />
      <Tabs params={params} counts={counts} />
      {params.tab === "COD" && counts.COD > 0 && (
        <p className="text-sm">
          ยอดเงินปลายทางที่ขนส่งยังไม่โอนให้:{" "}
          <span className="font-semibold tabular-nums">{formatBaht(codOutstanding)}</span>
        </p>
      )}
      <SearchForm params={params} />
      {params.date && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>
            แสดงเฉพาะ{dateLabel} <span className="font-semibold">{formatLongThaiDate(params.date)}</span>
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href={buildShippingHref({ ...params, date: undefined, page: 1 })}>ดูทุกวัน</Link>
          </Button>
        </div>
      )}
      {filtered && (
        <p className="text-sm text-muted-foreground">พบ {totalItems.toLocaleString("th-TH")} รายการ</p>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {params.q
              ? "ไม่พบออร์เดอร์ที่ตรงกับการค้นหา"
              : params.date
                ? `ไม่มีออร์เดอร์ในวันนี้ (นับตาม${dateLabel})`
                : EMPTY_MESSAGES[params.tab]}
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <ShipmentCard order={order} />
            </li>
          ))}
        </ul>
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefFor={(target) => buildShippingHref({ ...params, page: target })}
      />
    </div>
  );
}

const DATE_LABELS = { orderedAt: "วันที่สั่ง", shippedAt: "วันที่ส่ง" } as const;

const longThaiDate = new Intl.DateTimeFormat("th-TH", { timeZone: SHOP_TIME_ZONE, dateStyle: "long" });

/** "2026-11-11" → "11 พฤศจิกายน 2569" */
function formatLongThaiDate(dateKey: string) {
  return longThaiDate.format(new Date(`${dateKey}T12:00:00+07:00`));
}

const TAB_LABELS: Record<ShippingTab, string> = { PENDING: "รอส่ง", SHIPPED: "ส่งแล้ว", COD: "รอเงิน COD" };

const EMPTY_MESSAGES: Record<ShippingTab, string> = {
  PENDING: "ไม่มีออร์เดอร์รอส่ง 🎉",
  SHIPPED: "ยังไม่มีออร์เดอร์ที่ส่งแล้ว",
  COD: "ไม่มีเงินปลายทางค้างรับ 🎉",
};

// เปลี่ยนแท็บ: ล้างคำค้น แต่จำวันที่/เดือนในปฏิทินไว้
function Tabs({ params, counts }: { params: ShippingListParams; counts: Record<ShippingTab, number> }) {
  const current = params.tab;
  return (
    <nav aria-label="สถานะการจัดส่ง" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:inline-grid sm:w-[30rem]">
      {(Object.keys(TAB_LABELS) as ShippingTab[]).map((tab) => (
        <Link
          key={tab}
          href={buildShippingHref({ tab, q: "", page: 1, date: params.date, month: params.month })}
          aria-current={tab === current ? "page" : undefined}
          className={cn(
            "rounded-md px-2 py-2 text-center text-sm font-medium",
            tab === current ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {TAB_LABELS[tab]} <span className="whitespace-nowrap tabular-nums">({counts[tab].toLocaleString("th-TH")})</span>
        </Link>
      ))}
    </nav>
  );
}

// ฟอร์มค้นหาแบบ GET ธรรมดา — เก็บแท็บเดิมไว้ด้วย
function SearchForm({ params }: { params: ShippingListParams }) {
  return (
    <form action="/shipping" className="flex gap-2">
      {params.tab !== "PENDING" && <input type="hidden" name="tab" value={params.tab} />}
      {params.date && <input type="hidden" name="date" value={params.date} />}
      {params.month && <input type="hidden" name="month" value={params.month} />}
      <label className="sr-only" htmlFor="q">
        ค้นหา
      </label>
      <Input
        id="q"
        name="q"
        type="search"
        defaultValue={params.q}
        placeholder="ค้นหาชื่อลูกค้า เบอร์โทร หรือเลขพัสดุ"
        className="h-10 flex-1 text-base"
        maxLength={100}
      />
      <Button type="submit" className="h-10">
        <Search className="size-4" />
        <span className="sr-only sm:not-sr-only">ค้นหา</span>
      </Button>
      {params.q && (
        <Button asChild variant="ghost" className="h-10">
          <Link href={buildShippingHref({ ...params, q: "", page: 1 })}>ล้าง</Link>
        </Button>
      )}
    </form>
  );
}

function ShippingSkeleton() {
  return (
    <div className="space-y-3" aria-label="กำลังโหลด">
      <div className="h-80 w-full animate-pulse rounded-xl bg-muted sm:max-w-md" />
      <div className="h-10 w-80 max-w-full animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

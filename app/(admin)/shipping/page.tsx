import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { ListPagination } from "@/components/admin/list-pagination";
import { ShipmentCard } from "@/components/shipping/shipment-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth/session";
import type { SearchParams } from "@/lib/list-params";
import { cn } from "@/lib/utils";
import { countShipments, listShipments } from "@/lib/shipping/data";
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
  const [{ orders, totalItems, page, totalPages }, counts] = await Promise.all([
    listShipments(params),
    countShipments(),
  ]);

  return (
    <div className="space-y-4">
      <Tabs current={params.tab} counts={{ PENDING: counts.pending, SHIPPED: counts.shipped }} />
      <SearchForm params={params} />
      {params.q && (
        <p className="text-sm text-muted-foreground">พบ {totalItems.toLocaleString("th-TH")} รายการ</p>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {params.q
              ? "ไม่พบออร์เดอร์ที่ตรงกับการค้นหา"
              : params.tab === "PENDING"
                ? "ไม่มีออร์เดอร์รอส่ง 🎉"
                : "ยังไม่มีออร์เดอร์ที่ส่งแล้ว"}
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

const TAB_LABELS: Record<ShippingTab, string> = { PENDING: "รอส่ง", SHIPPED: "ส่งแล้ว" };

function Tabs({ current, counts }: { current: ShippingTab; counts: Record<ShippingTab, number> }) {
  return (
    <nav aria-label="สถานะการจัดส่ง" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:inline-grid sm:w-80">
      {(Object.keys(TAB_LABELS) as ShippingTab[]).map((tab) => (
        <Link
          key={tab}
          href={buildShippingHref({ tab, q: "", page: 1 })}
          aria-current={tab === current ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-2 text-center text-sm font-medium",
            tab === current ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {TAB_LABELS[tab]} <span className="tabular-nums">({counts[tab].toLocaleString("th-TH")})</span>
        </Link>
      ))}
    </nav>
  );
}

// ฟอร์มค้นหาแบบ GET ธรรมดา — เก็บแท็บเดิมไว้ด้วย
function SearchForm({ params }: { params: ShippingListParams }) {
  return (
    <form action="/shipping" className="flex gap-2">
      {params.tab === "SHIPPED" && <input type="hidden" name="tab" value="SHIPPED" />}
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
      <div className="h-10 w-80 max-w-full animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

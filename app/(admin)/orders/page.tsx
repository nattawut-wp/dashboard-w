import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderList } from "@/components/orders/order-list";
import { OrderPagination } from "@/components/orders/order-pagination";
import { getCurrentUser } from "@/lib/auth/session";
import { listOrders } from "@/lib/orders/data";
import { parseOrderListParams, type SearchParams } from "@/lib/orders/list-params";

export const metadata: Metadata = { title: "ออร์เดอร์" };

export default function OrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">ออร์เดอร์</h1>
        <Button asChild size="lg">
          <Link href="/orders/new">
            <Plus className="size-4" />
            เพิ่มออร์เดอร์
          </Link>
        </Button>
      </div>

      {/* อ่าน URL + session + ฐานข้อมูล → อยู่ใน Suspense ให้หัวหน้าแสดงได้ทันที */}
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await getCurrentUser();
  const params = parseOrderListParams(await searchParams);
  const { orders, totalItems, page, totalPages } = await listOrders(params);
  const filtered = params.q !== "" || params.status !== null;

  return (
    <div className="space-y-4">
      <OrderFilters q={params.q} status={params.status} />
      <p className="text-sm text-muted-foreground">
        {filtered ? "พบ" : "ทั้งหมด"} {totalItems.toLocaleString("th-TH")} รายการ
      </p>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {filtered ? "ไม่พบออร์เดอร์ที่ตรงกับการค้นหา" : "ยังไม่มีออร์เดอร์ กด “เพิ่มออร์เดอร์” เพื่อเริ่ม"}
          </CardContent>
        </Card>
      ) : (
        <OrderList orders={orders} />
      )}

      <OrderPagination {...params} page={page} totalPages={totalPages} />
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-3" aria-label="กำลังโหลด">
      <div className="h-10 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

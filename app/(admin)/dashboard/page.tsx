import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ArrowRight, Banknote, Truck } from "lucide-react";
import { SalesChart, SalesTable } from "@/components/dashboard/sales-chart";
import { StatusBadge } from "@/components/orders/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { CHART_DAYS, getDashboardData } from "@/lib/dashboard/data";
import { formatBaht, formatOrderNumber, formatThaiDateTime } from "@/lib/orders/format";

export const metadata: Metadata = { title: "ภาพรวม" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ภาพรวม</h1>
      {/* ตัวเลขขึ้นกับเวลาตอนเปิดหน้า + ฐานข้อมูล → อยู่ใน Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

const satangToBaht = (satang: number) => formatBaht(satang / 100);

async function DashboardContent() {
  await getCurrentUser();
  const data = await getDashboardData(new Date());
  const { today, month } = data.summary;
  const { low, out } = data.stockAlerts;

  return (
    <div className="space-y-6">
      {/* การ์ดสรุป — ยอดขายนับเฉพาะ "ชำระแล้ว" และ "จัดส่งแล้ว" (COD นับเมื่อส่งของ) */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard label="ยอดขายวันนี้" value={satangToBaht(today.total)} note={`${today.count.toLocaleString("th-TH")} ออร์เดอร์`} />
        <StatCard label="ยอดขายเดือนนี้" value={satangToBaht(month.total)} note={`${month.count.toLocaleString("th-TH")} ออร์เดอร์`} />
        <StatCard
          label="เฉลี่ยต่อออร์เดอร์"
          value={month.average === null ? "—" : satangToBaht(month.average)}
          note="เดือนนี้"
        />
        <StatCard
          label="รอเงิน COD"
          value={formatBaht(data.codOutstanding.total)}
          note={`${data.codOutstanding.count.toLocaleString("th-TH")} ออร์เดอร์ที่ส่งแล้ว`}
          href="/shipping?tab=COD"
          icon={<Banknote className="size-4" aria-hidden />}
        />
      </div>

      {/* งานที่ต้องทำ: รอจัดส่ง / สต็อกใกล้หมด */}
      <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
        <ActionCard
          href="/shipping"
          icon={<Truck className="size-5" aria-hidden />}
          title="รอจัดส่ง"
          value={`${data.pendingShipments.toLocaleString("th-TH")} ออร์เดอร์`}
          highlight={data.pendingShipments > 0}
        />
        <ActionCard
          href={out > 0 ? "/products?stock=OUT" : "/products?stock=LOW"}
          icon={<AlertTriangle className="size-5" aria-hidden />}
          title="สินค้าใกล้หมด / หมด"
          value={`ใกล้หมด ${low.toLocaleString("th-TH")} · หมด ${out.toLocaleString("th-TH")}`}
          highlight={low + out > 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ยอดขายรายวัน</CardTitle>
          <CardDescription>{CHART_DAYS} วันล่าสุด (ตามเวลาไทย) · ชี้ที่แท่งเพื่อดูยอด</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-2 sm:px-6">
          <SalesChart data={data.daily} />
          <details className="px-4 sm:px-0">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">ดูเป็นตาราง</summary>
            <div className="mt-2 max-h-72 overflow-y-auto">
              <SalesTable data={data.daily} />
            </div>
          </details>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>ออร์เดอร์ล่าสุด</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/orders">
              ดูทั้งหมด
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {data.recentOrders.length === 0 ? (
            <p className="px-6 py-6 text-center text-muted-foreground">ยังไม่มีออร์เดอร์</p>
          ) : (
            <ul className="divide-y">
              {data.recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}/edit`}
                    className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{formatOrderNumber(order.id)}</span> · {formatThaiDateTime(order.orderedAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums">{formatBaht(order.total)}</span>
                      <span className="inline-flex items-center gap-1">
                        <StatusBadge status={order.status} />
                        {order.paymentMethod === "COD" && <Badge variant="outline">COD</Badge>}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  href,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  href?: string;
  icon?: React.ReactNode;
}) {
  const content = (
    <Card className="h-full gap-1 py-4">
      <CardHeader className="px-4">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5 px-4">
        <div className="text-xl font-semibold tabular-nums md:text-2xl">{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </CardContent>
    </Card>
  );
  if (!href) return content;
  return (
    <Link href={href} className="rounded-xl hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {content}
    </Link>
  );
}

function ActionCard({
  href,
  icon,
  title,
  value,
  highlight,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  highlight: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none " +
        (highlight ? "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10" : "")
      }
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className="block text-sm text-muted-foreground">{title}</span>
          <span className="block font-semibold tabular-nums">{value}</span>
        </span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="กำลังโหลด">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

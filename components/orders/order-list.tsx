import Link from "next/link";
import { Package, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderListRow, OrderRow } from "@/lib/orders/types";
import { summarizeItems } from "@/lib/orders/items-summary";
import { formatBaht, formatOrderNumber, formatThaiDateTime, formatThaiPhone } from "@/lib/orders/format";
import { DeleteOrderButton } from "./delete-order-button";
import { StatusBadge } from "./status-badge";

// จอใหญ่ (md ขึ้นไป) = ตาราง / มือถือ = การ์ดเรียงลง (ไม่ต้องเลื่อนซ้าย-ขวา)
export function OrderList({ orders }: { orders: OrderListRow[] }) {
  return (
    <>
      <Card className="hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">เลขที่</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>สินค้า</TableHead>
              <TableHead>วันเวลาที่สั่ง</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">ยอดรวม</TableHead>
              <TableHead className="w-28 text-right">
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-muted-foreground">
                  {formatOrderNumber(order.id)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{order.customerName}</div>
                  {order.customerPhone && (
                    <div className="text-xs text-muted-foreground tabular-nums">{formatThaiPhone(order.customerPhone)}</div>
                  )}
                </TableCell>
                <TableCell className="max-w-64">
                  <ItemsSummary items={order.items} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatThaiDateTime(order.orderedAt)}</TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatBaht(order.total)}</TableCell>
                <TableCell>
                  <OrderActions order={order} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Card className="py-4">
              <CardContent className="space-y-3 px-4">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{formatOrderNumber(order.id)}</span>
                  <span>{formatThaiDateTime(order.orderedAt)}</span>
                </div>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 truncate font-medium">{order.customerName}</div>
                    <div className="shrink-0 text-right font-semibold tabular-nums">{formatBaht(order.total)}</div>
                  </div>
                  {order.customerPhone && (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-sm text-muted-foreground tabular-nums underline-offset-2 hover:underline"
                    >
                      {formatThaiPhone(order.customerPhone)}
                    </a>
                  )}
                </div>
                <ItemsSummary items={order.items} />
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={order.status} />
                  <OrderActions order={order} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

function OrderActions({ order }: { order: OrderRow }) {
  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="icon-lg" aria-label={`แก้ไขออร์เดอร์ ${formatOrderNumber(order.id)}`}>
        <Link href={`/orders/${order.id}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
      <DeleteOrderButton orderId={order.id} />
    </div>
  );
}

/** "เคสโทรศัพท์ใส ×2, หมวกแก๊ป ×1 · 3 ชิ้น" */
function ItemsSummary({ items }: { items: OrderListRow["items"] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">ไม่มีรายการสินค้า</p>;
  const { text, totalQuantity } = summarizeItems(items);
  return (
    <p className="flex items-start gap-1.5 text-sm">
      <Package className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0">
        {text}
        <span className="whitespace-nowrap text-muted-foreground"> · {totalQuantity.toLocaleString("th-TH")} ชิ้น</span>
      </span>
    </p>
  );
}

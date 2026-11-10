import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderListRow, OrderRow } from "@/lib/orders/types";
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
              <TableHead className="w-20 text-center">จำนวน</TableHead>
              <TableHead className="pl-6">วันเวลาที่สั่ง</TableHead>
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
                {/* ชื่อกับจำนวนอยู่คนละคอลัมน์ แต่บรรทัดตรงกัน (บรรทัดละ 1 สินค้า ไม่ตัดขึ้นบรรทัดใหม่) */}
                <TableCell className="max-w-72">
                  {order.items.length === 0 ? (
                    <span className="text-sm text-muted-foreground">ไม่มีรายการสินค้า</span>
                  ) : (
                    <ul className="space-y-1">
                      {order.items.map((item, i) => (
                        <li key={i} className="truncate" title={item.productName}>
                          {item.productName}
                        </li>
                      ))}
                    </ul>
                  )}
                </TableCell>
                <TableCell>
                  <ul className="space-y-1 text-center tabular-nums">
                    {order.items.map((item, i) => (
                      <li key={i}>{item.quantity.toLocaleString("th-TH")}</li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="pl-6 text-muted-foreground">{formatThaiDateTime(order.orderedAt)}</TableCell>
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
                <OrderItemsLines items={order.items} />
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

/** มือถือ: สินค้าละบรรทัด ชื่อซ้าย จำนวนขวา */
function OrderItemsLines({ items }: { items: OrderListRow["items"] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">ไม่มีรายการสินค้า</p>;
  return (
    <ul className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
      <li className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span>สินค้า</span>
        <span>จำนวน</span>
      </li>
      {items.map((item, i) => (
        <li key={i} className="flex justify-between gap-3">
          <span className="min-w-0 truncate">{item.productName}</span>
          <span className="shrink-0 tabular-nums">{item.quantity.toLocaleString("th-TH")}</span>
        </li>
      ))}
    </ul>
  );
}

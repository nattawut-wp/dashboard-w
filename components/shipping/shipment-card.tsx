import Link from "next/link";
import { Banknote, CircleCheck, MapPin, Package, TriangleAlert } from "lucide-react";
import { CopyButton } from "@/components/admin/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveShipment } from "@/app/(admin)/shipping/actions";
import { formatBaht, formatOrderNumber, formatThaiDateTime, formatThaiPhone } from "@/lib/orders/format";
import { carrierLabel } from "@/lib/shipping/carriers";
import type { ShipmentRow } from "@/lib/shipping/data";
import { shipmentBlocker } from "@/lib/shipping/rules";
import { PaymentBadge } from "@/components/orders/payment-badge";
import { StatusBadge } from "@/components/orders/status-badge";
import { CodActions } from "./cod-actions";
import { ShipForm } from "./ship-form";
import { ShippedActions } from "./shipped-actions";

/** ออร์เดอร์ 1 ใบในหน้าจัดส่ง: ลูกค้า + ที่อยู่ (คัดลอกได้) + ของที่ต้องแพ็ก + ฟอร์มบันทึกส่ง / เลขพัสดุ */
export function ShipmentCard({ order }: { order: ShipmentRow }) {
  const address = order.shippingAddress?.trim() ?? "";
  const shipped = order.status === "SHIPPED";
  const blocker = shipped ? null : shipmentBlocker(order, "ship");

  return (
    <Card className="py-4">
      <CardContent className="space-y-4 px-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex flex-wrap items-center gap-1.5">
            <Link href={`/orders/${order.id}/edit`} className="font-mono underline-offset-2 hover:underline">
              {formatOrderNumber(order.id)}
            </Link>
            <StatusBadge status={order.status} />
            <PaymentBadge paymentMethod={order.paymentMethod} status={order.status} codCollectedAt={order.codCollectedAt} />
          </span>
          <span>สั่ง {formatThaiDateTime(order.orderedAt)}</span>
        </div>

        <div>
          <div className="font-medium">{order.customerName}</div>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="text-sm text-muted-foreground tabular-nums underline-offset-2 hover:underline"
            >
              {formatThaiPhone(order.customerPhone)}
            </a>
          )}
        </div>

        {/* COD ที่ยังไม่ได้เงิน: ยอดที่ต้องให้ขนส่งเก็บ (กรอกในแอปขนส่ง) */}
        {order.paymentMethod === "COD" && !order.codCollectedAt && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-100 px-3 py-2 text-amber-950 dark:bg-amber-500/20 dark:text-amber-100">
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Banknote className="size-4" aria-hidden />
              เก็บเงินปลายทาง
              <span className="text-base font-semibold tabular-nums">{formatBaht(order.total)}</span>
            </span>
            <CopyButton text={order.total} label="ยอดเก็บเงินปลายทาง" />
          </div>
        )}

        {/* ที่อยู่เต็ม + ปุ่มคัดลอก (ไว้วางในแอปขนส่ง) */}
        {address ? (
          <div className="flex items-start gap-2 rounded-lg border px-3 py-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="min-w-0 flex-1 text-sm break-words whitespace-pre-line">{address}</p>
            <CopyButton text={[order.customerName, order.customerPhone, address].filter(Boolean).join("\n")} label="ที่อยู่" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-950 dark:bg-amber-500/20 dark:text-amber-100">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <TriangleAlert className="size-4" aria-hidden />
              ยังไม่มีที่อยู่จัดส่ง
            </span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/orders/${order.id}/edit`}>เพิ่มที่อยู่</Link>
            </Button>
          </div>
        )}

        {/* ของที่ต้องแพ็ก */}
        <ul className="space-y-1 rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <li className="flex justify-between gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Package className="size-3.5" aria-hidden />
              สินค้าที่ต้องแพ็ก
            </span>
            <span>จำนวน</span>
          </li>
          {order.items.length === 0 ? (
            <li className="text-muted-foreground">ไม่มีรายการสินค้า</li>
          ) : (
            order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="min-w-0">{item.productName}</span>
                <span className="shrink-0 font-medium tabular-nums">{item.quantity.toLocaleString("th-TH")}</span>
              </li>
            ))
          )}
        </ul>

        {order.note && <p className="text-sm text-muted-foreground">หมายเหตุ: {order.note}</p>}

        {shipped ? (
          <div className="space-y-3 border-t pt-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="text-muted-foreground">{carrierLabel(order.shippingCarrier)}</span>
              <span className="font-mono font-medium">{order.trackingNumber ?? "—"}</span>
              {order.trackingNumber && <CopyButton text={order.trackingNumber} label="เลขพัสดุ" />}
              {order.shippedAt && (
                <span className="text-xs text-muted-foreground">ส่งเมื่อ {formatThaiDateTime(order.shippedAt)}</span>
              )}
            </div>
            {order.paymentMethod === "COD" &&
              (order.codCollectedAt ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-300">
                  <CircleCheck className="size-4" aria-hidden />
                  ได้รับเงินปลายทางแล้ว {formatThaiDateTime(order.codCollectedAt)}
                </p>
              ) : (
                <CodActions orderId={order.id} total={order.total} />
              ))}
            <ShippedActions
              orderId={order.id}
              carrier={order.shippingCarrier ?? ""}
              trackingNumber={order.trackingNumber ?? ""}
              // ได้เงินปลายทางแล้ว → ย้อนกลับเป็นรอส่งไม่ได้
              canRevert={shipmentBlocker(order, "revert") === null}
            />
          </div>
        ) : (
          <div className="border-t pt-3">
            {blocker ? (
              <p className="text-sm text-muted-foreground">{blocker}</p>
            ) : (
              <ShipForm action={saveShipment.bind(null, order.id, "ship")} mode="ship" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

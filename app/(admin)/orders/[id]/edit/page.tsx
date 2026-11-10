import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteOrderButton } from "@/components/orders/delete-order-button";
import { OrderForm } from "@/components/orders/order-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrder, getOrderItems, listProductOptions } from "@/lib/orders/data";
import { toBangkokDateTimeInput } from "@/lib/orders/datetime";
import { formatOrderNumber } from "@/lib/orders/format";
import { orderToFormDefaults } from "@/lib/orders/form-defaults";
import { parseOrderId } from "@/lib/orders/order-id";
import { reservedQuantities } from "@/lib/orders/stock-changes";
import { saveOrder } from "../../actions";

export const metadata: Metadata = { title: "แก้ไขออร์เดอร์" };

export default function EditOrderPage({ params }: PageProps<"/orders/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <EditOrder params={params} />
      </Suspense>
    </div>
  );
}

async function EditOrder({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser();
  const id = parseOrderId((await params).id);
  const order = id === null ? null : await getOrder(id);
  if (!order) notFound();
  const items = await getOrderItems(order.id);
  const products = await listProductOptions(items.map((item) => item.productId));

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">แก้ไขออร์เดอร์ {formatOrderNumber(order.id)}</h1>
        <DeleteOrderButton orderId={order.id} redirectTo="/orders" showLabel />
      </div>
      <OrderForm
        action={saveOrder.bind(null, order.id)}
        defaults={orderToFormDefaults(order)}
        products={products}
        defaultItems={items}
        reserved={reservedQuantities({ status: order.status, items })}
        maxOrderedAt={toBangkokDateTimeInput(new Date())}
        submitLabel="บันทึกการแก้ไข"
      />
    </>
  );
}

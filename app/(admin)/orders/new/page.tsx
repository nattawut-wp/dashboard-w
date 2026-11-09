import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm } from "@/components/orders/order-form";
import { getCurrentUser } from "@/lib/auth/session";
import { toBangkokDateTimeInput } from "@/lib/orders/datetime";
import { newOrderFormDefaults } from "@/lib/orders/form-defaults";
import { saveOrder } from "../actions";

export const metadata: Metadata = { title: "เพิ่มออร์เดอร์" };

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">เพิ่มออร์เดอร์</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <NewOrderForm />
      </Suspense>
    </div>
  );
}

// ค่าเริ่มต้นใช้ "เวลาตอนเปิดหน้า" → ต้องคำนวณตอนมีคนเปิด ไม่ใช่ตอน build
async function NewOrderForm() {
  await getCurrentUser();
  const now = new Date();
  return (
    <OrderForm
      action={saveOrder.bind(null, null)}
      defaults={newOrderFormDefaults(now)}
      maxOrderedAt={toBangkokDateTimeInput(now)}
      submitLabel="เพิ่มออร์เดอร์"
    />
  );
}

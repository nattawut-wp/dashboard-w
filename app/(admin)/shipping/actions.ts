"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { stockChanges } from "@/lib/orders/stock-changes";
import { revertedStatus, shipmentBlocker } from "@/lib/shipping/rules";
import { parseShipmentForm, type ShipmentErrors } from "@/lib/shipping/validation";

export type SaveShipmentState = {
  success?: boolean;
  message?: string;
  errors?: ShipmentErrors;
  /** ค่าที่ผู้ใช้กรอก — ส่งกลับไปเติมฟอร์มเมื่อบันทึกไม่ผ่าน */
  values?: { carrier: string; trackingNumber: string };
  /** เวลาที่บันทึกสำเร็จ — ฟอร์มใช้รู้ว่าเพิ่งบันทึก */
  savedAt?: number;
};

const NOT_FOUND = "ไม่พบออร์เดอร์นี้ อาจถูกลบไปแล้ว";

// ข้อมูลที่ shipmentBlocker ใช้ตัดสิน
const ORDER_STATE = { status: true, shippingAddress: true, paymentMethod: true, codCollectedAt: true } as const;

// เงื่อนไข "ส่งได้" ระดับฐานข้อมูล (ตรงกับ shipmentBlocker): ชำระแล้ว หรือ COD ที่รอชำระ
const READY_TO_SHIP: Prisma.OrderWhereInput = {
  OR: [{ status: "PAID" }, { status: "PENDING", paymentMethod: "COD" }],
};
const CHANGED = "สถานะออร์เดอร์เปลี่ยนไประหว่างนี้ กรุณาโหลดหน้าใหม่";

/**
 * ship = บันทึกการจัดส่ง (ชำระแล้ว → จัดส่งแล้ว + เวลาส่ง)
 * update = แก้ขนส่ง/เลขพัสดุของออร์เดอร์ที่ส่งแล้ว
 * สต็อกไม่เปลี่ยน — ตัดไปแล้วตอนสร้างออร์เดอร์
 */
export async function saveShipment(
  orderId: number,
  mode: "ship" | "update",
  _prev: SaveShipmentState,
  formData: FormData,
): Promise<SaveShipmentState> {
  await getCurrentUser(); // ไม่ได้ login → ถูกพาไปหน้า login (กันคนยิง action ตรงๆ)

  const input = { carrier: formData.get("carrier"), trackingNumber: formData.get("trackingNumber") };
  const values = {
    carrier: typeof input.carrier === "string" ? input.carrier : "",
    trackingNumber: typeof input.trackingNumber === "string" ? input.trackingNumber : "",
  };
  const parsed = parseShipmentForm(input);
  if (!parsed.success) return { errors: parsed.errors, values };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: ORDER_STATE,
  });
  if (!order) return { message: NOT_FOUND };
  const blocker = shipmentBlocker(order, mode);
  if (blocker) return { message: blocker, values };

  // เงื่อนไขสถานะอยู่ในคำสั่งเดียวกับการบันทึก — ถ้ามีคนเปลี่ยนสถานะไประหว่างนี้จะไม่ทับ
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, ...(mode === "ship" ? READY_TO_SHIP : { status: "SHIPPED" }) },
    data: {
      shippingCarrier: parsed.data.carrier,
      trackingNumber: parsed.data.trackingNumber,
      ...(mode === "ship" && { status: "SHIPPED", shippedAt: new Date() }),
    },
  });
  if (count === 0) return { message: CHANGED, values };

  revalidateShippingPages();
  return { success: true, savedAt: Date.now() };
}

/** ย้อนกลับเป็นรอส่ง (กดบันทึกส่งผิด) — ล้างขนส่ง/เลขพัสดุ/เวลาส่ง */
export async function revertShipment(orderId: number): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: ORDER_STATE,
  });
  if (!order) return { success: false, message: NOT_FOUND };
  const blocker = shipmentBlocker(order, "revert");
  if (blocker) return { success: false, message: blocker };

  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: "SHIPPED", codCollectedAt: null },
    // โอนเงิน → กลับเป็นชำระแล้ว / COD → กลับเป็นรอชำระ (ยังไม่ได้เก็บเงิน)
    data: { status: revertedStatus(order.paymentMethod), shippedAt: null, shippingCarrier: null, trackingNumber: null },
  });
  if (count === 0) return { success: false, message: CHANGED };

  revalidateShippingPages();
  return { success: true };
}

/** ขนส่งโอนเงินปลายทาง (COD) ให้ร้านแล้ว */
export async function markCodCollected(orderId: number): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: ORDER_STATE });
  if (!order) return { success: false, message: NOT_FOUND };
  const blocker = shipmentBlocker(order, "collect");
  if (blocker) return { success: false, message: blocker };

  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: "SHIPPED", paymentMethod: "COD", codCollectedAt: null },
    data: { codCollectedAt: new Date() },
  });
  if (count === 0) return { success: false, message: CHANGED };

  revalidateShippingPages();
  return { success: true };
}

/** พัสดุตีกลับ (ลูกค้าไม่รับของ COD) → ยกเลิกออร์เดอร์ + คืนสต็อก + จดหมายเหตุ ในก้อนเดียว */
export async function markReturned(orderId: number): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();

  try {
    await prisma.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          select: { ...ORDER_STATE, note: true, items: { select: { productId: true, quantity: true } } },
        });
        if (!order) throw new ShipmentError(NOT_FOUND);
        const blocker = shipmentBlocker(order, "return");
        if (blocker) throw new ShipmentError(blocker);

        const { count } = await tx.order.updateMany({
          where: { id: orderId, status: "SHIPPED", paymentMethod: "COD", codCollectedAt: null },
          data: {
            status: "CANCELLED",
            note: [order.note, "พัสดุตีกลับ (ลูกค้าไม่รับของ)"].filter(Boolean).join("\n"),
          },
        });
        if (count === 0) throw new ShipmentError(CHANGED);

        // ส่งแล้ว → ยกเลิก = คืนสต็อกทุกรายการ (คำนวณแบบเดียวกับหน้าออร์เดอร์)
        const changes = stockChanges(
          { status: "SHIPPED", items: order.items },
          { status: "CANCELLED", items: order.items },
        );
        for (const { productId, delta } of changes) {
          await tx.product.update({ where: { id: productId }, data: { stock: { increment: delta } } });
        }
      },
      { timeout: 20_000, maxWait: 10_000 },
    );
  } catch (error) {
    if (error instanceof ShipmentError) return { success: false, message: error.message };
    throw error;
  }

  revalidateShippingPages();
  revalidatePath("/products");
  return { success: true };
}

/** ข้อความที่แสดงให้ผู้ใช้เห็น — โยนเพื่อยกเลิก transaction */
class ShipmentError extends Error {}

function revalidateShippingPages() {
  revalidatePath("/shipping");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

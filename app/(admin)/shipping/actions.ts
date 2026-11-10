"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { shipmentBlocker } from "@/lib/shipping/rules";
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
    select: { status: true, shippingAddress: true },
  });
  if (!order) return { message: NOT_FOUND };
  const blocker = shipmentBlocker(order, mode);
  if (blocker) return { message: blocker, values };

  // เงื่อนไขสถานะอยู่ในคำสั่งเดียวกับการบันทึก — ถ้ามีคนเปลี่ยนสถานะไประหว่างนี้จะไม่ทับ
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: mode === "ship" ? "PAID" : "SHIPPED" },
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
    select: { status: true, shippingAddress: true },
  });
  if (!order) return { success: false, message: NOT_FOUND };
  const blocker = shipmentBlocker(order, "revert");
  if (blocker) return { success: false, message: blocker };

  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: "SHIPPED" },
    data: { status: "PAID", shippedAt: null, shippingCarrier: null, trackingNumber: null },
  });
  if (count === 0) return { success: false, message: CHANGED };

  revalidateShippingPages();
  return { success: true };
}

function revalidateShippingPages() {
  revalidatePath("/shipping");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ORDER_FIELDS, parseOrderForm, type OrderFormErrors } from "@/lib/orders/validation";

export type SaveOrderState = {
  success?: boolean;
  message?: string;
  errors?: OrderFormErrors;
  /** ค่าที่ผู้ใช้กรอก — ส่งกลับไปเติมฟอร์มเมื่อบันทึกไม่ผ่าน */
  values?: Partial<Record<(typeof ORDER_FIELDS)[number], string>>;
};

/** เพิ่ม (orderId = null) หรือแก้ไขออร์เดอร์ — ใช้กับ useActionState ในฟอร์ม */
export async function saveOrder(
  orderId: number | null,
  _prev: SaveOrderState,
  formData: FormData,
): Promise<SaveOrderState> {
  await getCurrentUser(); // ไม่ได้ login → ถูกพาไปหน้า login (กันคนยิง action ตรงๆ)

  const input = Object.fromEntries(ORDER_FIELDS.map((field) => [field, formData.get(field)]));
  const parsed = parseOrderForm(input, new Date());
  if (!parsed.success) {
    const values = Object.fromEntries(
      ORDER_FIELDS.map((field) => [field, typeof input[field] === "string" ? input[field] : ""]),
    );
    return { errors: parsed.errors, values, message: "กรุณาตรวจข้อมูลที่กรอกอีกครั้ง" };
  }

  try {
    if (orderId === null) {
      await prisma.order.create({ data: parsed.data });
    } else {
      await prisma.order.update({ where: { id: orderId }, data: parsed.data });
    }
  } catch (error) {
    if (isNotFound(error)) return { message: "ไม่พบออร์เดอร์นี้ อาจถูกลบไปแล้ว" };
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();

  try {
    await prisma.order.delete({ where: { id: orderId } });
  } catch (error) {
    if (isNotFound(error)) return { success: false, message: "ไม่พบออร์เดอร์นี้ อาจถูกลบไปแล้ว" };
    throw error;
  }

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return { success: true };
}

// P2025 = Prisma หาแถวที่จะแก้/ลบไม่เจอ
function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

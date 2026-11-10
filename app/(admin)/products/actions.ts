"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseStockAdjustment } from "@/lib/products/stock-adjust";
import { PRODUCT_FIELDS, parseProductForm, type ProductFormErrors } from "@/lib/products/validation";

export type SaveProductState = {
  success?: boolean;
  message?: string;
  errors?: ProductFormErrors;
  /** ค่าที่ผู้ใช้กรอก — ส่งกลับไปเติมฟอร์มเมื่อบันทึกไม่ผ่าน */
  values?: Partial<Record<(typeof PRODUCT_FIELDS)[number], string>>;
};

const NOT_FOUND = "ไม่พบสินค้านี้ อาจถูกลบไปแล้ว";
const CHECK_FORM = "กรุณาตรวจข้อมูลที่กรอกอีกครั้ง";

/** เพิ่ม (productId = null) หรือแก้ไขสินค้า — ใช้กับ useActionState ในฟอร์ม */
export async function saveProduct(
  productId: number | null,
  _prev: SaveProductState,
  formData: FormData,
): Promise<SaveProductState> {
  await getCurrentUser(); // ไม่ได้ login → ถูกพาไปหน้า login (กันคนยิง action ตรงๆ)

  const input = Object.fromEntries(PRODUCT_FIELDS.map((field) => [field, formData.get(field)]));
  const values = Object.fromEntries(
    PRODUCT_FIELDS.map((field) => [field, typeof input[field] === "string" ? input[field] : ""]),
  );

  try {
    if (productId === null) {
      const parsed = parseProductForm(input, "create");
      if (!parsed.success) return { errors: parsed.errors, values, message: CHECK_FORM };
      await prisma.product.create({ data: parsed.data });
    } else {
      // แก้ไข: ไม่แตะจำนวนคงเหลือ (ต้องใช้ "ปรับสต็อก")
      const parsed = parseProductForm(input, "update");
      if (!parsed.success) return { errors: parsed.errors, values, message: CHECK_FORM };
      await prisma.product.update({ where: { id: productId }, data: parsed.data });
    }
  } catch (error) {
    if (hasCode(error, "P2002")) {
      return { errors: { sku: "รหัสสินค้านี้มีอยู่แล้ว" }, values, message: CHECK_FORM };
    }
    if (hasCode(error, "P2025")) return { message: NOT_FOUND };
    throw error;
  }

  revalidatePath("/products");
  return { success: true };
}

export type AdjustStockState = {
  success?: boolean;
  message?: string;
  errors?: { mode?: string; quantity?: string };
  /** คงเหลือล่าสุดหลังบันทึก */
  stock?: number;
  /** เวลาที่บันทึกสำเร็จ — ฟอร์มใช้ล้างช่องกรอกหลังบันทึก */
  savedAt?: number;
};

/** ปรับสต็อก: รับเข้า / ตัดออก / ตั้งยอดใหม่ */
export async function adjustStock(
  productId: number,
  _prev: AdjustStockState,
  formData: FormData,
): Promise<AdjustStockState> {
  await getCurrentUser();

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (!product) return { message: NOT_FOUND };

  const parsed = parseStockAdjustment(
    { mode: formData.get("mode"), quantity: formData.get("quantity") },
    product.stock,
  );
  if (!parsed.success) return { errors: parsed.errors };

  const { mode, quantity, newStock } = parsed.data;
  if (mode === "DEDUCT") {
    // เช็คซ้ำตอนบันทึก: ถ้าระหว่างนี้มีคนขายไปจนเหลือไม่พอ จะไม่ตัด (ไม่ปล่อยให้ติดลบ)
    const { count } = await prisma.product.updateMany({
      where: { id: productId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (count === 0) return { message: "คงเหลือเปลี่ยนไประหว่างนี้ กรุณาตรวจจำนวนอีกครั้ง" };
  } else if (mode === "RECEIVE") {
    await prisma.product.update({ where: { id: productId }, data: { stock: { increment: quantity } } });
  } else {
    await prisma.product.update({ where: { id: productId }, data: { stock: newStock } });
  }

  const updated = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  revalidatePath("/products");
  return { success: true, stock: updated?.stock ?? newStock, savedAt: Date.now() };
}

/** เลิกขาย (false) / กลับมาขาย (true) */
export async function setProductActive(
  productId: number,
  isActive: boolean,
): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();
  try {
    await prisma.product.update({ where: { id: productId }, data: { isActive } });
  } catch (error) {
    if (hasCode(error, "P2025")) return { success: false, message: NOT_FOUND };
    throw error;
  }
  revalidatePath("/products");
  return { success: true };
}

/** ลบสินค้า — ได้เฉพาะสินค้าที่ยังไม่เคยขาย (ฐานข้อมูลกันไว้ด้วย foreign key) */
export async function deleteProduct(productId: number): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();
  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch (error) {
    if (hasCode(error, "P2025")) return { success: false, message: NOT_FOUND };
    if (hasCode(error, "P2003")) {
      return { success: false, message: "สินค้านี้เคยขายแล้ว ลบไม่ได้ ใช้ “เลิกขาย” แทน" };
    }
    throw error;
  }
  revalidatePath("/products");
  return { success: true };
}

// P2002 = ค่าซ้ำ (SKU), P2003 = ยังมีข้อมูลอื่นอ้างถึง, P2025 = หาแถวไม่เจอ
function hasCode(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

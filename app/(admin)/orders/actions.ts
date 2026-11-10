"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { parseOrderItems, type OrderItemInput } from "@/lib/orders/items";
import { shortageMessage, stockChanges, type OrderStockState } from "@/lib/orders/stock-changes";
import { ORDER_FIELDS, parseOrderForm, type OrderFormErrors } from "@/lib/orders/validation";

export type SaveOrderState = {
  success?: boolean;
  message?: string;
  errors?: OrderFormErrors & { items?: string };
  /** ค่าที่ผู้ใช้กรอก — ส่งกลับไปเติมฟอร์มเมื่อบันทึกไม่ผ่าน */
  values?: Partial<Record<(typeof ORDER_FIELDS)[number], string>>;
};

const NOT_FOUND = "ไม่พบออร์เดอร์นี้ อาจถูกลบไปแล้ว";

/** ข้อผิดพลาดที่แสดงให้ผู้ใช้เห็นได้ (สต็อกไม่พอ, สินค้าเลิกขาย ฯลฯ) — โยนเพื่อยกเลิกทั้ง transaction */
class OrderItemsError extends Error {}
class OrderNotFoundError extends Error {}

// ทั้งหมดต้องเสร็จในก้อนเดียว — ฐานข้อมูลอยู่สิงคโปร์ ให้เวลามากกว่าค่าเริ่มต้น 5 วินาที
const TRANSACTION_OPTIONS = { timeout: 20_000, maxWait: 10_000 };

/** เพิ่ม (orderId = null) หรือแก้ไขออร์เดอร์ — ใช้กับ useActionState ในฟอร์ม */
export async function saveOrder(
  orderId: number | null,
  _prev: SaveOrderState,
  formData: FormData,
): Promise<SaveOrderState> {
  await getCurrentUser(); // ไม่ได้ login → ถูกพาไปหน้า login (กันคนยิง action ตรงๆ)

  const input = Object.fromEntries(ORDER_FIELDS.map((field) => [field, formData.get(field)]));
  const values = Object.fromEntries(
    ORDER_FIELDS.map((field) => [field, typeof input[field] === "string" ? input[field] : ""]),
  );
  const parsed = parseOrderForm(input, new Date());
  const items = parseOrderItems(formData.getAll("itemProductId"), formData.getAll("itemQuantity"));
  if (!parsed.success || !items.success) {
    return {
      errors: { ...(!parsed.success && parsed.errors), ...(!items.success && { items: items.error }) },
      values,
      message: "กรุณาตรวจข้อมูลที่กรอกอีกครั้ง",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // ของเดิม (ตอนแก้ไข) — ใช้คำนวณส่วนต่างสต็อก
      const before =
        orderId === null
          ? null
          : await tx.order.findUnique({
              where: { id: orderId },
              select: { status: true, items: { select: { productId: true, quantity: true } } },
            });
      if (orderId !== null && !before) throw new OrderNotFoundError();

      const products = await loadProducts(tx, items.items, before);
      const after: OrderStockState = { status: parsed.data.status, items: items.items };
      await applyStockChanges(tx, stockChanges(before, after), products);

      const itemRows = items.items.map(({ productId, quantity }) => ({
        productId,
        quantity,
        productName: products.get(productId)!.name, // ชื่อ ณ ตอนขาย
      }));
      if (orderId === null) {
        await tx.order.create({ data: { ...parsed.data, items: { create: itemRows } } });
      } else {
        await tx.orderItem.deleteMany({ where: { orderId } });
        await tx.order.update({ where: { id: orderId }, data: { ...parsed.data, items: { create: itemRows } } });
      }
    }, TRANSACTION_OPTIONS);
  } catch (error) {
    if (error instanceof OrderItemsError) {
      return { errors: { items: error.message }, values, message: "กรุณาตรวจรายการสินค้าอีกครั้ง" };
    }
    if (error instanceof OrderNotFoundError || isNotFound(error)) return { message: NOT_FOUND };
    throw error;
  }

  revalidateOrderPages();
  return { success: true };
}

/** ลบออร์เดอร์ — คืนสต็อกของรายการทั้งหมด (ถ้ายังไม่ได้ยกเลิก) */
export async function deleteOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
  await getCurrentUser();

  try {
    await prisma.$transaction(async (tx) => {
      const before = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true, items: { select: { productId: true, quantity: true } } },
      });
      if (!before) throw new OrderNotFoundError();
      // คืนสต็อกอย่างเดียว ไม่มีทางไม่พอ
      for (const { productId, delta } of stockChanges(before, null)) {
        await tx.product.update({ where: { id: productId }, data: { stock: { increment: delta } } });
      }
      await tx.order.delete({ where: { id: orderId } }); // รายการสินค้าถูกลบตาม (cascade)
    }, TRANSACTION_OPTIONS);
  } catch (error) {
    if (error instanceof OrderNotFoundError || isNotFound(error)) return { success: false, message: NOT_FOUND };
    throw error;
  }

  revalidateOrderPages();
  return { success: true };
}

type Tx = Prisma.TransactionClient;
type ProductInfo = { name: string };

/**
 * ดึงชื่อสินค้าที่เลือก + ตรวจว่ายังมีอยู่
 * สินค้าที่เลิกขายใส่เพิ่มไม่ได้ แต่ถ้าอยู่ในออร์เดอร์เดิมอยู่แล้วเก็บไว้ได้ (แก้ออร์เดอร์เก่าได้)
 */
async function loadProducts(
  tx: Tx,
  items: OrderItemInput[],
  before: { items: OrderItemInput[] } | null,
): Promise<Map<number, ProductInfo>> {
  const found = await tx.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    select: { id: true, name: true, isActive: true },
  });
  const byId = new Map(found.map((product) => [product.id, product]));
  const existing = new Set(before?.items.map((item) => item.productId));

  for (const { productId } of items) {
    const product = byId.get(productId);
    if (!product) throw new OrderItemsError("มีสินค้าที่ถูกลบไปแล้ว กรุณาเลือกใหม่");
    if (!product.isActive && !existing.has(productId)) {
      throw new OrderItemsError(`“${product.name}” เลิกขายแล้ว เลือกสินค้าอื่นแทน`);
    }
  }
  return byId;
}

/**
 * ตัด/คืนสต็อก — ตัดแบบมีเงื่อนไข "เหลือพอ" ในคำสั่งเดียว (ถ้ามีคนสั่งพร้อมกัน สต็อกจะไม่ติดลบ)
 * ถ้าไม่พอ โยน OrderItemsError → ยกเลิกทั้ง transaction (ไม่มีอะไรถูกบันทึก)
 */
async function applyStockChanges(
  tx: Tx,
  changes: { productId: number; delta: number }[],
  products: Map<number, ProductInfo>,
) {
  for (const { productId, delta } of changes) {
    if (delta > 0) {
      await tx.product.update({ where: { id: productId }, data: { stock: { increment: delta } } });
      continue;
    }
    const needed = -delta;
    const { count } = await tx.product.updateMany({
      where: { id: productId, stock: { gte: needed } },
      data: { stock: { decrement: needed } },
    });
    if (count === 0) {
      const current = await tx.product.findUnique({ where: { id: productId }, select: { stock: true, name: true } });
      const name = products.get(productId)?.name ?? current?.name ?? `สินค้า #${productId}`;
      throw new OrderItemsError(shortageMessage(name, current?.stock ?? 0, needed));
    }
  }
}

function revalidateOrderPages() {
  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

// P2025 = Prisma หาแถวที่จะแก้/ลบไม่เจอ
function isNotFound(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

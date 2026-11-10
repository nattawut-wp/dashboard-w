import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginate, type OrderListParams } from "./list-params";
import type { OrderItemRow, OrderRow, ProductOption } from "./types";

export type { OrderRow };

// ฟังก์ชันในไฟล์นี้ไม่เช็คสิทธิ์เอง — ผู้เรียกต้องเรียก getCurrentUser() ก่อนเสมอ

const select = {
  id: true,
  customerName: true,
  customerPhone: true,
  total: true,
  status: true,
  orderedAt: true,
  note: true,
} satisfies Prisma.OrderSelect;

function toRow(order: Prisma.OrderGetPayload<{ select: typeof select }>): OrderRow {
  return { ...order, total: order.total.toFixed(2) };
}

export async function listOrders({ q, status, page }: OrderListParams) {
  const digits = q.replace(/\D/g, "");
  const where: Prisma.OrderWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { customerName: { contains: q, mode: "insensitive" } },
        // ค้นเบอร์โทรด้วยตัวเลขล้วน (พิมพ์ 081-234 ก็หาเจอ)
        ...(digits ? [{ customerPhone: { contains: digits } }] : []),
      ],
    }),
  };

  const totalItems = await prisma.order.count({ where });
  const pagination = paginate(totalItems, page);
  const orders = await prisma.order.findMany({
    where,
    select,
    orderBy: [{ orderedAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  return { orders: orders.map(toRow), totalItems, ...pagination };
}

export async function getOrder(id: number): Promise<OrderRow | null> {
  const order = await prisma.order.findUnique({ where: { id }, select });
  return order ? toRow(order) : null;
}

export async function getOrderItems(orderId: number): Promise<OrderItemRow[]> {
  return prisma.orderItem.findMany({
    where: { orderId },
    select: { productId: true, productName: true, quantity: true },
    orderBy: { id: "asc" },
  });
}

/**
 * สินค้าให้เลือกในฟอร์มออร์เดอร์: สินค้าที่ยังขาย + สินค้าที่อยู่ในออร์เดอร์นี้อยู่แล้ว (แม้เลิกขายไปแล้ว)
 */
export async function listProductOptions(includeIds: number[] = []): Promise<ProductOption[]> {
  return prisma.product.findMany({
    where: { OR: [{ isActive: true }, { id: { in: includeIds } }] },
    select: { id: true, sku: true, name: true, stock: true, isActive: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
}

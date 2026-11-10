import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { paginate } from "@/lib/list-params";
import { prisma } from "@/lib/prisma";
import type { ShippingListParams, ShippingTab } from "./list-params";

// ฟังก์ชันในไฟล์นี้ไม่เช็คสิทธิ์เอง — ผู้เรียกต้องเรียก getCurrentUser() ก่อนเสมอ

const select = {
  id: true,
  customerName: true,
  customerPhone: true,
  shippingAddress: true,
  note: true,
  status: true,
  orderedAt: true,
  shippingCarrier: true,
  trackingNumber: true,
  shippedAt: true,
  items: { select: { productName: true, quantity: true }, orderBy: { id: "asc" } },
} satisfies Prisma.OrderSelect;

export type ShipmentRow = Prisma.OrderGetPayload<{ select: typeof select }>;

/** แท็บรอส่ง = ชำระแล้ว, แท็บส่งแล้ว = จัดส่งแล้ว */
const STATUS_OF_TAB = { PENDING: "PAID", SHIPPED: "SHIPPED" } as const satisfies Record<ShippingTab, string>;

export async function listShipments({ tab, q, page }: ShippingListParams) {
  const digits = q.replace(/\D/g, "");
  const where: Prisma.OrderWhereInput = {
    status: STATUS_OF_TAB[tab],
    ...(q && {
      OR: [
        { customerName: { contains: q, mode: "insensitive" } },
        ...(digits ? [{ customerPhone: { contains: digits } }] : []),
        { trackingNumber: { contains: q.replace(/[\s-]/g, "").toUpperCase() } },
      ],
    }),
  };

  const totalItems = await prisma.order.count({ where });
  const pagination = paginate(totalItems, page);
  const orders = await prisma.order.findMany({
    where,
    select,
    // รอส่ง: เก่าสุดก่อน (ลูกค้ารอนานสุด) / ส่งแล้ว: ส่งล่าสุดก่อน
    orderBy:
      tab === "PENDING"
        ? [{ orderedAt: "asc" }, { id: "asc" }]
        : [{ shippedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  return { orders, totalItems, ...pagination };
}

/** จำนวนในแต่ละแท็บ (ไม่สนคำค้น) */
export async function countShipments() {
  const [pending, shipped] = await Promise.all([
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
  ]);
  return { pending, shipped };
}

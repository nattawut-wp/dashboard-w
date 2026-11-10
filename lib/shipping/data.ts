import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { paginate, phoneSearchDigits } from "@/lib/list-params";
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
  paymentMethod: true,
  total: true,
  codCollectedAt: true,
  orderedAt: true,
  shippingCarrier: true,
  trackingNumber: true,
  shippedAt: true,
  items: { select: { productName: true, quantity: true }, orderBy: { id: "asc" } },
} satisfies Prisma.OrderSelect;

type ShipmentPayload = Prisma.OrderGetPayload<{ select: typeof select }>;
/** ยอดเงินเป็นข้อความ (Decimal ส่งเข้า Client Component ไม่ได้) */
export type ShipmentRow = Omit<ShipmentPayload, "total"> & { total: string };

/**
 * รอส่ง = ชำระแล้ว + COD ที่รอชำระ (เก็บเงินตอนส่ง)
 * ส่งแล้ว = จัดส่งแล้วทั้งหมด
 * รอเงิน COD = COD ที่ส่งแล้วแต่ขนส่งยังไม่โอนเงินให้
 */
const TAB_WHERE: Record<ShippingTab, Prisma.OrderWhereInput> = {
  PENDING: { OR: [{ status: "PAID" }, { status: "PENDING", paymentMethod: "COD" }] },
  SHIPPED: { status: "SHIPPED" },
  COD: { status: "SHIPPED", paymentMethod: "COD", codCollectedAt: null },
};

const TAB_ORDER: Record<ShippingTab, Prisma.OrderOrderByWithRelationInput[]> = {
  PENDING: [{ orderedAt: "asc" }, { id: "asc" }], // ลูกค้ารอนานสุดก่อน
  SHIPPED: [{ shippedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }], // ส่งล่าสุดก่อน
  COD: [{ shippedAt: { sort: "asc", nulls: "first" } }, { id: "asc" }], // ค้างเงินนานสุดก่อน
};

export async function listShipments({ tab, q, page }: ShippingListParams) {
  const digits = phoneSearchDigits(q);
  const search: Prisma.OrderWhereInput = {
    OR: [
      { customerName: { contains: q, mode: "insensitive" } },
      ...(digits ? [{ customerPhone: { contains: digits } }] : []),
      { trackingNumber: { contains: q.replace(/[\s-]/g, "").toUpperCase() } },
    ],
  };
  const where: Prisma.OrderWhereInput = { AND: [TAB_WHERE[tab], ...(q ? [search] : [])] };

  const totalItems = await prisma.order.count({ where });
  const pagination = paginate(totalItems, page);
  const orders = await prisma.order.findMany({
    where,
    select,
    orderBy: TAB_ORDER[tab],
    skip: pagination.skip,
    take: pagination.take,
  });

  const rows: ShipmentRow[] = orders.map((order) => ({ ...order, total: order.total.toFixed(2) }));
  return { orders: rows, totalItems, ...pagination };
}

/** จำนวนในแต่ละแท็บ (ไม่สนคำค้น) + ยอดเงิน COD ที่ยังไม่ได้รับ */
export async function countShipments() {
  const [pending, shipped, cod] = await Promise.all([
    prisma.order.count({ where: TAB_WHERE.PENDING }),
    prisma.order.count({ where: TAB_WHERE.SHIPPED }),
    prisma.order.aggregate({ where: TAB_WHERE.COD, _count: true, _sum: { total: true } }),
  ]);
  return {
    counts: { PENDING: pending, SHIPPED: shipped, COD: cod._count } satisfies Record<ShippingTab, number>,
    codOutstanding: (cod._sum.total ?? 0).toString(),
  };
}

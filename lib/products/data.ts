import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { paginate } from "@/lib/list-params";
import { prisma } from "@/lib/prisma";
import type { ProductListParams, StockFilter } from "./list-params";
import type { ProductRow } from "./types";

export type { ProductRow };

// ฟังก์ชันในไฟล์นี้ไม่เช็คสิทธิ์เอง — ผู้เรียกต้องเรียก getCurrentUser() ก่อนเสมอ

const select = {
  id: true,
  sku: true,
  name: true,
  stock: true,
  lowStockThreshold: true,
  isActive: true,
} satisfies Prisma.ProductSelect;

function toRow(product: Prisma.ProductGetPayload<{ select: typeof select }>): ProductRow {
  return product;
}

// เงื่อนไขของแต่ละตัวกรอง — "ใกล้หมด" เทียบกับเกณฑ์ของสินค้าแต่ละตัว (เทียบคอลัมน์กับคอลัมน์)
// ต้องตรงกับ stockLevel() ใน ./stock.ts
function stockWhere(filter: StockFilter | null): Prisma.ProductWhereInput {
  switch (filter) {
    case "LOW":
      return { isActive: true, stock: { gt: 0, lte: prisma.product.fields.lowStockThreshold } };
    case "OUT":
      return { isActive: true, stock: { lte: 0 } };
    case "INACTIVE":
      return { isActive: false };
    default:
      return { isActive: true };
  }
}

export async function listProducts({ q, stock, page }: ProductListParams) {
  const where: Prisma.ProductWhereInput = {
    ...stockWhere(stock),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const totalItems = await prisma.product.count({ where });
  const pagination = paginate(totalItems, page);
  const products = await prisma.product.findMany({
    where,
    select,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    skip: pagination.skip,
    take: pagination.take,
  });

  return { products: products.map(toRow), totalItems, ...pagination };
}

/** จำนวนสินค้าใกล้หมด / หมด (เฉพาะที่ยังขาย) — ใช้ทำป้ายเตือนบนหน้าคลังสินค้าและ Dashboard */
export async function countStockAlerts() {
  const [low, out] = await Promise.all([
    prisma.product.count({ where: stockWhere("LOW") }),
    prisma.product.count({ where: stockWhere("OUT") }),
  ]);
  return { low, out };
}

/** สินค้า 1 ตัว + จำนวนออร์เดอร์ที่เคยขาย (เคยขายแล้วลบไม่ได้) */
export async function getProduct(id: number) {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { ...select, _count: { select: { orderItems: true } } },
  });
  if (!product) return null;
  const { _count, ...rest } = product;
  return { product: toRow(rest), soldInOrders: _count.orderItems };
}

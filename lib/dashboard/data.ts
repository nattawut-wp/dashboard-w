import "server-only";
import { prisma } from "@/lib/prisma";
import { countStockAlerts } from "@/lib/products/data";
import { countShipments } from "@/lib/shipping/data";
import { lastBangkokDays, startOfBangkokMonth } from "./dates";
import { dailySales, summarizeSales, type SaleInput } from "./sales";

// ฟังก์ชันในไฟล์นี้ไม่เช็คสิทธิ์เอง — ผู้เรียกต้องเรียก getCurrentUser() ก่อนเสมอ

export const CHART_DAYS = 30;
const RECENT_ORDERS = 8;

export async function getDashboardData(now: Date) {
  // ดึงออร์เดอร์ตั้งแต่วันแรกของกราฟ หรือวันที่ 1 ของเดือน (อันไหนเก่ากว่า) — พอสำหรับทั้งการ์ดและกราฟ
  const chartStart = new Date(`${lastBangkokDays(now, CHART_DAYS)[0]}T00:00:00+07:00`);
  const monthStart = startOfBangkokMonth(now);
  const since = chartStart < monthStart ? chartStart : monthStart;

  const [orders, recent, shipping, stock] = await Promise.all([
    prisma.order.findMany({
      where: { orderedAt: { gte: since }, status: { in: ["PAID", "SHIPPED"] } },
      select: { status: true, orderedAt: true, total: true },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        customerName: true,
        total: true,
        status: true,
        paymentMethod: true,
        orderedAt: true,
      },
      orderBy: [{ orderedAt: "desc" }, { id: "desc" }],
      take: RECENT_ORDERS,
    }),
    countShipments(),
    countStockAlerts(),
  ]);

  const sales: SaleInput[] = orders.map((order) => ({ ...order, total: order.total.toFixed(2) }));
  return {
    summary: summarizeSales(sales, now),
    daily: dailySales(sales, now, CHART_DAYS),
    recentOrders: recent.map((order) => ({ ...order, total: order.total.toFixed(2) })),
    pendingShipments: shipping.counts.PENDING,
    codOutstanding: { count: shipping.counts.COD, total: shipping.codOutstanding },
    stockAlerts: stock,
  };
}

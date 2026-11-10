"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart";
import { formatShortThaiDate } from "@/lib/dashboard/dates";
import type { DailySales } from "@/lib/dashboard/sales";
import { formatBaht } from "@/lib/orders/format";

// สีเดียว (ยอดขายเป็นข้อมูลชุดเดียว → ไม่ต้องมีกล่อง legend หัวการ์ดบอกชื่ออยู่แล้ว)
const config = {
  total: { label: "ยอดขาย", color: "var(--chart-sales)" },
} satisfies ChartConfig;

/** แกน Y แบบย่อ: 12,500 → "12.5k" */
function compactBaht(value: number): string {
  if (value >= 1000) return `${Number((value / 1000).toFixed(1))}k`;
  return String(value);
}

export function SalesChart({ data }: { data: DailySales[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full sm:h-72">
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tickFormatter={formatShortThaiDate}
        />
        <YAxis width={44} tickLine={false} axisLine={false} tickFormatter={compactBaht} allowDecimals={false} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<SalesTooltip />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ChartContainer>
  );
}

/** ชี้แท่งไหน: วันที่ + ยอดขาย + จำนวนออร์เดอร์ */
function SalesTooltip({ active, payload }: { active?: boolean; payload?: { payload: DailySales }[] }) {
  const day = active ? payload?.[0]?.payload : undefined;
  if (!day) return null;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-xs shadow-md">
      <div className="font-medium">{formatShortThaiDate(day.date)}</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-[var(--chart-sales)]" aria-hidden />
        <span className="font-semibold tabular-nums">{formatBaht(day.total)}</span>
        <span className="text-muted-foreground">· {day.count.toLocaleString("th-TH")} ออร์เดอร์</span>
      </div>
    </div>
  );
}

/** ตารางข้อมูลเดียวกับกราฟ (สำหรับคนที่อ่านกราฟไม่ได้ / โปรแกรมอ่านหน้าจอ) — ใหม่สุดก่อน */
export function SalesTable({ data }: { data: DailySales[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-muted-foreground">
          <th className="py-1 font-normal">วันที่</th>
          <th className="py-1 text-right font-normal">ออร์เดอร์</th>
          <th className="py-1 text-right font-normal">ยอดขาย</th>
        </tr>
      </thead>
      <tbody>
        {[...data].reverse().map((day) => (
          <tr key={day.date} className="border-t">
            <td className="py-1">{formatShortThaiDate(day.date)}</td>
            <td className="py-1 text-right tabular-nums">{day.count.toLocaleString("th-TH")}</td>
            <td className="py-1 text-right tabular-nums">{formatBaht(day.total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

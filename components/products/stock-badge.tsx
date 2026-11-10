import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { stockLevel, stockLevelLabel, type StockLevel } from "@/lib/products/stock";

// สีของแต่ละระดับ — ใช้ร่วมกับข้อความเสมอ (ไม่ใช้สีอย่างเดียวบอกความหมาย)
const STYLES: Record<StockLevel, string> = {
  OUT: "bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-200",
  LOW: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  OK: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
};

export function StockBadge({ stock, lowStockThreshold }: { stock: number; lowStockThreshold: number }) {
  const level = stockLevel(stock, lowStockThreshold);
  return (
    <Badge variant="secondary" className={cn("border-transparent font-medium", STYLES[level])}>
      {stockLevelLabel(level)}
    </Badge>
  );
}

/** "คงเหลือ 12" + ป้ายระดับ */
export function StockAmount({ stock, lowStockThreshold }: { stock: number; lowStockThreshold: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="font-medium tabular-nums">{stock.toLocaleString("th-TH")}</span>
      <StockBadge stock={stock} lowStockThreshold={lowStockThreshold} />
    </span>
  );
}

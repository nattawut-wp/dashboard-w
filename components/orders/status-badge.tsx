import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusLabel, type OrderStatus } from "@/lib/orders/status";

// สีของแต่ละสถานะ — ใช้ร่วมกับข้อความเสมอ (ไม่ใช้สีอย่างเดียวบอกความหมาย)
const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  PAID: "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
  SHIPPED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  CANCELLED: "bg-muted text-muted-foreground line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent font-medium", STYLES[status])}>
      {statusLabel(status)}
    </Badge>
  );
}

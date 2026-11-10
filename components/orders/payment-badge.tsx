import type { PaymentMethod } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { codPaymentState } from "@/lib/orders/payment";

type Props = { paymentMethod: PaymentMethod; status: string; codCollectedAt: Date | null };

const STYLES = {
  WAITING: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  COLLECTED: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
};

/** ป้าย COD: ยังไม่ส่ง = "COD" / ส่งแล้ว = "COD รอเงิน" หรือ "COD ได้เงินแล้ว" — โอนเงินไม่มีป้าย */
export function PaymentBadge(props: Props) {
  if (props.paymentMethod !== "COD") return null;
  const state = codPaymentState(props);
  if (!state) return <Badge variant="outline">COD</Badge>;
  return (
    <Badge variant="secondary" className={cn("font-medium", STYLES[state])}>
      {state === "WAITING" ? "COD รอเงิน" : "COD ได้เงินแล้ว"}
    </Badge>
  );
}

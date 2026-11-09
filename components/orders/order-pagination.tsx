import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildOrderListHref, type OrderListParams } from "@/lib/orders/list-params";

type Props = OrderListParams & { totalPages: number };

export function OrderPagination({ q, status, page, totalPages }: Props) {
  if (totalPages <= 1) return null;
  const href = (target: number) => buildOrderListHref({ q, status, page: target });

  return (
    <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-between gap-2">
      <PageLink href={page > 1 ? href(page - 1) : null} label="ก่อนหน้า" icon="prev" />
      <span className="text-sm text-muted-foreground">
        หน้า {page} / {totalPages}
      </span>
      <PageLink href={page < totalPages ? href(page + 1) : null} label="ถัดไป" icon="next" />
    </nav>
  );
}

function PageLink({ href, label, icon }: { href: string | null; label: string; icon: "prev" | "next" }) {
  const content = (
    <>
      {icon === "prev" && <ChevronLeft className="size-4" />}
      {label}
      {icon === "next" && <ChevronRight className="size-4" />}
    </>
  );
  if (!href) {
    return (
      <Button variant="outline" disabled>
        {content}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline">
      <Link href={href}>{content}</Link>
    </Button>
  );
}

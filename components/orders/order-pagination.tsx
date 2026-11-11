import { ListPagination } from "@/components/admin/list-pagination";
import { buildOrderListHref, type OrderListParams } from "@/lib/orders/list-params";

type Props = OrderListParams & { totalPages: number };

export function OrderPagination({ q, status, page, totalPages }: Props) {
  return (
    <ListPagination
      page={page}
      totalPages={totalPages}
      hrefFor={(target) => buildOrderListHref({ q, status, page: target })}
    />
  );
}

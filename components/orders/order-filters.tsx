import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderListParams } from "@/lib/orders/list-params";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders/status";

// ฟอร์มค้นหาแบบ GET ธรรมดา: กดค้นหา → URL เปลี่ยนเป็น /orders?q=...&status=... (ใช้ได้แม้ JS ยังโหลดไม่เสร็จ)
export function OrderFilters({ q, status }: Pick<OrderListParams, "q" | "status">) {
  const filtered = q !== "" || status !== null;
  return (
    <form action="/orders" className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="q">
        ค้นหา
      </label>
      <Input
        id="q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="ค้นหาชื่อลูกค้า หรือเบอร์โทร"
        className="h-10 text-base sm:flex-1"
        maxLength={100}
      />
      <label className="sr-only" htmlFor="status">
        สถานะ
      </label>
      <select
        id="status"
        name="status"
        defaultValue={status ?? ""}
        className="h-10 rounded-lg border border-input bg-background px-3 text-base sm:w-44"
      >
        <option value="">ทุกสถานะ</option>
        {ORDER_STATUSES.map((value) => (
          <option key={value} value={value}>
            {statusLabel(value)}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="submit" className="h-10 flex-1 sm:flex-none">
          <Search className="size-4" />
          ค้นหา
        </Button>
        {filtered && (
          <Button asChild variant="ghost" className="h-10">
            <Link href="/orders">ล้างตัวกรอง</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

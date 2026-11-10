import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductListParams, StockFilter } from "@/lib/products/list-params";

const FILTER_LABELS: Record<StockFilter, string> = {
  LOW: "ใกล้หมด",
  OUT: "หมดแล้ว",
  INACTIVE: "เลิกขาย",
};

// ฟอร์มค้นหาแบบ GET ธรรมดา: กดค้นหา → URL เปลี่ยนเป็น /products?q=...&stock=... (ใช้ได้แม้ JS ยังโหลดไม่เสร็จ)
export function ProductFilters({ q, stock }: Pick<ProductListParams, "q" | "stock">) {
  const filtered = q !== "" || stock !== null;
  return (
    <form action="/products" className="flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="q">
        ค้นหา
      </label>
      <Input
        id="q"
        name="q"
        type="search"
        defaultValue={q}
        placeholder="ค้นหาชื่อสินค้า หรือรหัสสินค้า"
        className="h-10 text-base sm:flex-1"
        maxLength={100}
      />
      <label className="sr-only" htmlFor="stock">
        สต็อก
      </label>
      <select
        id="stock"
        name="stock"
        defaultValue={stock ?? ""}
        className="h-10 rounded-lg border border-input bg-background px-3 text-base sm:w-44"
      >
        <option value="">สินค้าที่ขายอยู่</option>
        {(Object.keys(FILTER_LABELS) as StockFilter[]).map((value) => (
          <option key={value} value={value}>
            {FILTER_LABELS[value]}
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
            <Link href="/products">ล้างตัวกรอง</Link>
          </Button>
        )}
      </div>
    </form>
  );
}

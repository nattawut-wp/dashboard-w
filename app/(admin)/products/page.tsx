import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { ListPagination } from "@/components/admin/list-pagination";
import { ProductFilters } from "@/components/products/product-filters";
import { ProductList } from "@/components/products/product-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import type { SearchParams } from "@/lib/list-params";
import { countStockAlerts, listProducts } from "@/lib/products/data";
import { buildProductListHref, parseProductListParams } from "@/lib/products/list-params";

export const metadata: Metadata = { title: "คลังสินค้า" };

export default function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">คลังสินค้า</h1>
        <Button asChild size="lg">
          <Link href="/products/new">
            <Plus className="size-4" />
            เพิ่มสินค้า
          </Link>
        </Button>
      </div>

      {/* อ่าน URL + session + ฐานข้อมูล → อยู่ใน Suspense ให้หัวหน้าแสดงได้ทันที */}
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ProductsContent({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await getCurrentUser();
  const params = parseProductListParams(await searchParams);
  const [{ products, totalItems, page, totalPages }, alerts] = await Promise.all([
    listProducts(params),
    countStockAlerts(),
  ]);
  const filtered = params.q !== "" || params.stock !== null;

  return (
    <div className="space-y-4">
      <StockAlerts low={alerts.low} out={alerts.out} />
      <ProductFilters q={params.q} stock={params.stock} />
      <p className="text-sm text-muted-foreground">
        {filtered ? "พบ" : "ทั้งหมด"} {totalItems.toLocaleString("th-TH")} รายการ
      </p>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {filtered ? "ไม่พบสินค้าที่ตรงกับการค้นหา" : "ยังไม่มีสินค้า กด “เพิ่มสินค้า” เพื่อเริ่ม"}
          </CardContent>
        </Card>
      ) : (
        <ProductList products={products} />
      )}

      <ListPagination
        page={page}
        totalPages={totalPages}
        hrefFor={(target) => buildProductListHref({ ...params, page: target })}
      />
    </div>
  );
}

/** แถบเตือนสินค้าใกล้หมด / หมด — กดแล้วกรองให้เลย */
function StockAlerts({ low, out }: { low: number; out: number }) {
  if (low === 0 && out === 0) return null;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden />
      {out > 0 && (
        <Link href={buildProductListHref({ q: "", stock: "OUT", page: 1 })} className="font-medium underline">
          หมดแล้ว {out} รายการ
        </Link>
      )}
      {low > 0 && (
        <Link href={buildProductListHref({ q: "", stock: "LOW", page: 1 })} className="font-medium underline">
          ใกล้หมด {low} รายการ
        </Link>
      )}
    </div>
  );
}

function ProductsSkeleton() {
  return (
    <div className="space-y-3" aria-label="กำลังโหลด">
      <div className="h-10 animate-pulse rounded-lg bg-muted" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

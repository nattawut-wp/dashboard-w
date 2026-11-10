import Link from "next/link";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductRow } from "@/lib/products/types";
import { StockAmount } from "./stock-badge";

// จอใหญ่ (md ขึ้นไป) = ตาราง / มือถือ = การ์ดเรียงลง
export function ProductList({ products }: { products: ProductRow[] }) {
  return (
    <>
      <Card className="hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">รหัสสินค้า</TableHead>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead>คงเหลือ</TableHead>
              <TableHead className="w-16 text-right">
                <span className="sr-only">จัดการ</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-mono text-muted-foreground">{product.sku}</TableCell>
                <TableCell>
                  <span className="font-medium">{product.name}</span>
                  {!product.isActive && <InactiveBadge />}
                </TableCell>
                <TableCell>
                  <StockAmount stock={product.stock} lowStockThreshold={product.lowStockThreshold} />
                </TableCell>
                <TableCell>
                  <EditButton product={product} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <ul className="space-y-3 md:hidden">
        {products.map((product) => (
          <li key={product.id}>
            <Card className="py-4">
              <CardContent className="space-y-3 px-4">
                <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{product.sku}</span>
                  {!product.isActive && <InactiveBadge />}
                </div>
                <div className="font-medium">{product.name}</div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">
                    คงเหลือ{" "}
                    <StockAmount stock={product.stock} lowStockThreshold={product.lowStockThreshold} />
                  </span>
                  <EditButton product={product} />
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}

function InactiveBadge() {
  return (
    <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
      เลิกขาย
    </Badge>
  );
}

function EditButton({ product }: { product: ProductRow }) {
  return (
    <div className="flex justify-end">
      <Button asChild variant="ghost" size="icon-lg" aria-label={`แก้ไข / ปรับสต็อก ${product.name}`}>
        <Link href={`/products/${product.id}/edit`}>
          <Pencil className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductForm } from "@/components/products/product-form";
import { ProductStatusActions } from "@/components/products/product-status-actions";
import { StockAdjustForm } from "@/components/products/stock-adjust-form";
import { getCurrentUser } from "@/lib/auth/session";
import { parseId } from "@/lib/ids";
import { getProduct } from "@/lib/products/data";
import { productToFormDefaults } from "@/lib/products/form-defaults";
import { adjustStock, saveProduct } from "../../actions";

export const metadata: Metadata = { title: "แก้ไขสินค้า" };

export default function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <EditProduct params={params} />
      </Suspense>
    </div>
  );
}

async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await getCurrentUser();
  const id = parseId((await params).id);
  const found = id === null ? null : await getProduct(id);
  if (!found) notFound();
  const { product, soldInOrders } = found;

  return (
    <>
      <div className="space-y-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {!product.isActive && (
            <p className="mt-1 text-sm text-muted-foreground">
              เลิกขายแล้ว — ไม่แสดงให้เลือกตอนสร้างออร์เดอร์ แต่ออร์เดอร์เก่ายังอ้างถึงได้
            </p>
          )}
        </div>
        <ProductStatusActions
          productId={product.id}
          name={product.name}
          isActive={product.isActive}
          soldInOrders={soldInOrders}
        />
        {soldInOrders > 0 && (
          <p className="text-xs text-muted-foreground">
            ขายไปแล้วใน {soldInOrders.toLocaleString("th-TH")} ออร์เดอร์ จึงลบไม่ได้ (ใช้ “เลิกขาย” แทน)
          </p>
        )}
      </div>

      <StockAdjustForm
        action={adjustStock.bind(null, product.id)}
        stock={product.stock}
        lowStockThreshold={product.lowStockThreshold}
      />

      <h2 className="pt-2 text-lg font-semibold">ข้อมูลสินค้า</h2>
      <ProductForm
        action={saveProduct.bind(null, product.id)}
        defaults={productToFormDefaults(product)}
        mode="update"
        submitLabel="บันทึกการแก้ไข"
      />
    </>
  );
}

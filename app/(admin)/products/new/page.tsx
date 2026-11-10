import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductForm } from "@/components/products/product-form";
import { getCurrentUser } from "@/lib/auth/session";
import { newProductFormDefaults } from "@/lib/products/form-defaults";
import { saveProduct } from "../actions";

export const metadata: Metadata = { title: "เพิ่มสินค้า" };

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">เพิ่มสินค้า</h1>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
        <NewProductForm />
      </Suspense>
    </div>
  );
}

async function NewProductForm() {
  await getCurrentUser();
  return (
    <ProductForm
      action={saveProduct.bind(null, null)}
      defaults={newProductFormDefaults()}
      mode="create"
      submitLabel="เพิ่มสินค้า"
    />
  );
}

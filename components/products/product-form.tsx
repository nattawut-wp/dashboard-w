"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SaveProductState } from "@/app/(admin)/products/actions";
import type { PRODUCT_FIELDS } from "@/lib/products/validation";

type Field = (typeof PRODUCT_FIELDS)[number];

type Props = {
  action: (prev: SaveProductState, formData: FormData) => Promise<SaveProductState>;
  defaults: Record<Field, string>;
  /** เพิ่มสินค้า = มีช่องจำนวนเริ่มต้น / แก้ไข = ไม่มี (ใช้ "ปรับสต็อก") */
  mode: "create" | "update";
  submitLabel: string;
};

export function ProductForm({ action, defaults, mode, submitLabel }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success("บันทึกแล้ว");
      router.push("/products");
    } else if (state.message && !state.errors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const error = (field: Field) => state.errors?.[field];
  // React ล้างฟอร์มกลับเป็น defaultValue หลังส่งทุกครั้ง → ถ้าบันทึกไม่ผ่าน ใช้ค่าที่ผู้ใช้กรอกไว้
  const fieldProps = (field: Field) => ({
    id: field,
    name: field,
    defaultValue: state.values?.[field] ?? defaults[field],
    "aria-invalid": !!error(field),
    "aria-describedby": error(field) ? `${field}-error` : undefined,
  });

  return (
    <Card>
      <CardContent>
        <form action={formAction} noValidate className="space-y-5">
          {state.message && state.errors && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}

          <FormField label="ชื่อสินค้า" field="name" error={error("name")} required>
            <Input {...fieldProps("name")} autoComplete="off" maxLength={100} className="h-11 text-base" />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="รหัสสินค้า (SKU)" field="sku" error={error("sku")} required>
              <Input
                {...fieldProps("sku")}
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={30}
                placeholder="TS-WHT-M"
                className="h-11 font-mono text-base uppercase"
              />
            </FormField>

            {mode === "create" && (
              <FormField label="จำนวนเริ่มต้น" field="stock" error={error("stock")} required>
                <Input {...fieldProps("stock")} inputMode="numeric" className="h-11 text-base tabular-nums" />
              </FormField>
            )}

            <FormField
              label="เตือนเมื่อเหลือไม่เกิน"
              field="lowStockThreshold"
              error={error("lowStockThreshold")}
              hint="0 = ไม่เตือน"
              required
            >
              <Input
                {...fieldProps("lowStockThreshold")}
                inputMode="numeric"
                className="h-11 text-base tabular-nums"
              />
            </FormField>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href="/products">ยกเลิก</Link>
            </Button>
            <Button type="submit" size="lg" className="h-11" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "กำลังบันทึก…" : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

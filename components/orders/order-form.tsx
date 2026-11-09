"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SaveOrderState } from "@/app/(admin)/orders/actions";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders/status";
import type { OrderFormDefaults } from "@/lib/orders/form-defaults";
import type { ORDER_FIELDS } from "@/lib/orders/validation";

type Field = (typeof ORDER_FIELDS)[number];

type Props = {
  action: (prev: SaveOrderState, formData: FormData) => Promise<SaveOrderState>;
  defaults: OrderFormDefaults;
  /** วันเวลาปัจจุบัน (เวลาไทย) — ใช้จำกัดช่องวันที่ไม่ให้เลือกอนาคต */
  maxOrderedAt: string;
  submitLabel: string;
};

export function OrderForm({ action, defaults, maxOrderedAt, submitLabel }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success("บันทึกแล้ว");
      router.push("/orders");
    } else if (state.message && !state.errors) {
      toast.error(state.message);
    }
  }, [state, router]);

  const error = (field: Field) => state.errors?.[field];
  // React ล้างฟอร์มกลับเป็น defaultValue หลังส่งทุกครั้ง → ถ้าบันทึกไม่ผ่าน ใช้ค่าที่ผู้ใช้กรอกไว้ (state.values)
  // ไม่งั้นสิ่งที่พิมพ์จะหายหมด
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

          <FieldBlock label="ชื่อลูกค้า" field="customerName" error={error("customerName")} required>
            <Input {...fieldProps("customerName")} autoComplete="off" maxLength={100} className="h-11 text-base" />
          </FieldBlock>

          <div className="grid gap-5 sm:grid-cols-2">
            <FieldBlock label="เบอร์โทร" field="customerPhone" error={error("customerPhone")} hint="ไม่บังคับ">
              <Input
                {...fieldProps("customerPhone")}
                type="tel"
                inputMode="tel"
                placeholder="0812345678"
                className="h-11 text-base"
              />
            </FieldBlock>

            <FieldBlock label="ยอดรวม (บาท)" field="total" error={error("total")} required>
              <Input
                {...fieldProps("total")}
                inputMode="decimal"
                placeholder="0.00"
                className="h-11 text-base tabular-nums"
              />
            </FieldBlock>

            <FieldBlock label="สถานะ" field="status" error={error("status")} required>
              <select
                {...fieldProps("status")}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base aria-invalid:border-destructive"
              >
                {ORDER_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </select>
            </FieldBlock>

            <FieldBlock label="วันเวลาที่สั่ง" field="orderedAt" error={error("orderedAt")} required>
              <Input {...fieldProps("orderedAt")} type="datetime-local" max={maxOrderedAt} className="h-11 text-base" />
            </FieldBlock>
          </div>

          <FieldBlock label="หมายเหตุ" field="note" error={error("note")} hint="ไม่บังคับ">
            <Textarea {...fieldProps("note")} rows={3} maxLength={500} className="text-base" />
          </FieldBlock>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" size="lg" className="h-11">
              <Link href="/orders">ยกเลิก</Link>
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

function FieldBlock({
  label,
  field,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  field: Field;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field}>
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
        {hint && <span className="font-normal text-muted-foreground"> ({hint})</span>}
      </Label>
      {children}
      {error && (
        <p id={`${field}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

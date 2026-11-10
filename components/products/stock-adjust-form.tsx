"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AdjustStockState } from "@/app/(admin)/products/actions";
import { parseStockAdjustment, STOCK_ADJUST_MODES, type StockAdjustMode } from "@/lib/products/stock-adjust";
import { StockAmount } from "./stock-badge";

const MODE_LABELS: Record<StockAdjustMode, { label: string; hint: string }> = {
  RECEIVE: { label: "รับเข้า +", hint: "ของมาส่ง / เติมสต็อก" },
  DEDUCT: { label: "ตัดออก −", hint: "ของเสีย / สูญหาย / ใช้เอง" },
  SET: { label: "ตั้งยอดใหม่ =", hint: "นับของจริงแล้วได้เท่านี้" },
};

type Props = {
  action: (prev: AdjustStockState, formData: FormData) => Promise<AdjustStockState>;
  stock: number;
  lowStockThreshold: number;
};

export function StockAdjustForm({ action, stock, lowStockThreshold }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success(`ปรับสต็อกแล้ว คงเหลือ ${state.stock?.toLocaleString("th-TH")} ชิ้น`);
      router.refresh(); // โหลดคงเหลือใหม่จากฐานข้อมูล
    } else if (state.message) {
      toast.error(state.message);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          ปรับสต็อก
          <span className="text-sm font-normal text-muted-foreground">
            คงเหลือตอนนี้ <StockAmount stock={stock} lowStockThreshold={lowStockThreshold} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} noValidate className="space-y-4">
          {/* บันทึกสำเร็จ → savedAt เปลี่ยน → ช่องกรอกถูกสร้างใหม่ (ล้างค่าเอง) */}
          <AdjustFields key={state.savedAt ?? 0} stock={stock} serverError={state.errors} />
          <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? "กำลังบันทึก…" : "บันทึกการปรับสต็อก"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AdjustFields({ stock, serverError }: { stock: number; serverError?: AdjustStockState["errors"] }) {
  const [mode, setMode] = useState<StockAdjustMode>("RECEIVE");
  const [quantity, setQuantity] = useState("");

  // คำนวณคงเหลือหลังปรับให้เห็นก่อนกดบันทึก (ใช้ฟังก์ชันเดียวกับที่เซิร์ฟเวอร์ใช้)
  const preview = quantity.trim() === "" ? null : parseStockAdjustment({ mode, quantity }, stock);
  const quantityError =
    (preview && !preview.success ? preview.errors.quantity : undefined) ?? serverError?.quantity;

  return (
    <>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">ประเภท</legend>
        <div className="grid grid-cols-3 gap-2">
          {STOCK_ADJUST_MODES.map((value) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col items-center rounded-lg border px-2 py-2 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                mode === value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="mode"
                value={value}
                checked={mode === value}
                onChange={() => setMode(value)}
                className="sr-only"
              />
              <span className="font-medium">{MODE_LABELS[value].label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{MODE_LABELS[mode].hint}</p>
        {serverError?.mode && <p className="mt-1 text-sm text-destructive">{serverError.mode}</p>}
      </fieldset>

      <FormField label={mode === "SET" ? "จำนวนที่นับได้" : "จำนวน"} field="quantity" error={quantityError}>
        <Input
          id="quantity"
          name="quantity"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          aria-invalid={!!quantityError}
          aria-describedby={quantityError ? "quantity-error" : undefined}
          className="h-11 text-base tabular-nums"
        />
      </FormField>

      {preview?.success && (
        <p className="text-sm">
          คงเหลือหลังปรับ:{" "}
          <span className="font-semibold tabular-nums">
            {stock.toLocaleString("th-TH")} → {preview.data.newStock.toLocaleString("th-TH")} ชิ้น
          </span>
        </p>
      )}
    </>
  );
}

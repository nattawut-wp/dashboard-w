"use client";

import { useActionState, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SaveShipmentState } from "@/app/(admin)/shipping/actions";
import { CARRIERS, carrierLabel } from "@/lib/shipping/carriers";

type Props = {
  action: (prev: SaveShipmentState, formData: FormData) => Promise<SaveShipmentState>;
  /** ship = บันทึกการจัดส่ง / update = แก้เลขพัสดุ */
  mode: "ship" | "update";
  defaults?: { carrier: string; trackingNumber: string };
  /** บันทึกสำเร็จแล้วทำอะไรต่อ (เช่น ปิดฟอร์มแก้ไข) */
  onSaved?: () => void;
};

export function ShipForm({ action, mode, defaults, onSaved }: Props) {
  const router = useRouter();
  const id = useId(); // หลายฟอร์มในหน้าเดียว → id ต้องไม่ซ้ำ
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) {
      toast.success(mode === "ship" ? "บันทึกการจัดส่งแล้ว" : "แก้เลขพัสดุแล้ว");
      onSaved?.();
      router.refresh();
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, mode, onSaved, router]);

  const values = state.values ?? defaults;
  const { carrier: carrierError, trackingNumber: trackingError } = state.errors ?? {};

  return (
    <form action={formAction} noValidate className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="sm:w-44">
          <label className="sr-only" htmlFor={`${id}-carrier`}>
            ขนส่ง
          </label>
          <select
            // key: ค่าที่ส่งกลับมาเปลี่ยน → สร้างช่องใหม่ให้ defaultValue ใหม่มีผล
            key={values?.carrier ?? ""}
            id={`${id}-carrier`}
            name="carrier"
            defaultValue={values?.carrier ?? ""}
            aria-invalid={!!carrierError}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base aria-invalid:border-destructive"
          >
            <option value="">— เลือกขนส่ง —</option>
            {CARRIERS.map((carrier) => (
              <option key={carrier} value={carrier}>
                {carrierLabel(carrier)}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`${id}-tracking`}>
            เลขพัสดุ
          </label>
          <Input
            key={values?.trackingNumber ?? ""}
            id={`${id}-tracking`}
            name="trackingNumber"
            defaultValue={values?.trackingNumber ?? ""}
            placeholder="เลขพัสดุ"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={40}
            aria-invalid={!!trackingError}
            className="h-11 font-mono text-base uppercase"
          />
        </div>
        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
          {mode === "ship" ? "บันทึกการจัดส่ง" : "บันทึก"}
        </Button>
      </div>
      {(carrierError || trackingError) && (
        <p role="alert" className="text-sm text-destructive">
          {[carrierError, trackingError].filter(Boolean).join(" · ")}
        </p>
      )}
    </form>
  );
}

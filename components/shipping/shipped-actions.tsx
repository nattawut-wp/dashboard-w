"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { revertShipment, saveShipment } from "@/app/(admin)/shipping/actions";
import { formatOrderNumber } from "@/lib/orders/format";
import { ShipForm } from "./ship-form";

type Props = { orderId: number; carrier: string; trackingNumber: string };

/** แท็บ "ส่งแล้ว": แก้เลขพัสดุ / ย้อนกลับเป็นรอส่ง */
export function ShippedActions({ orderId, carrier, trackingNumber }: Props) {
  const [editing, setEditing] = useState(false);
  const close = useCallback(() => setEditing(false), []);

  if (editing) {
    return (
      <div className="space-y-2">
        <ShipForm
          action={saveShipment.bind(null, orderId, "update")}
          mode="update"
          defaults={{ carrier, trackingNumber }}
          onSaved={close}
        />
        <Button type="button" variant="ghost" size="sm" onClick={close}>
          ยกเลิกการแก้ไข
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="size-4" />
        แก้เลขพัสดุ
      </Button>
      <RevertButton orderId={orderId} />
    </div>
  );
}

function RevertButton({ orderId }: { orderId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const number = formatOrderNumber(orderId);

  function handleRevert() {
    startTransition(async () => {
      const result = await revertShipment(orderId);
      if (!result.success) {
        toast.error(result.message ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      toast.success(`ย้าย ${number} กลับไปรอส่งแล้ว`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
          <Undo2 className="size-4" />
          ย้อนกลับเป็นรอส่ง
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ย้าย {number} กลับไปรอส่งใช่ไหม?</AlertDialogTitle>
          <AlertDialogDescription>
            ใช้เมื่อกดบันทึกการจัดส่งผิด — ขนส่งและเลขพัสดุจะถูกล้าง สถานะกลับเป็น “ชำระแล้ว” (สต็อกไม่เปลี่ยน)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          <Button onClick={handleRevert} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            ย้อนกลับเป็นรอส่ง
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
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
import { deleteOrder } from "@/app/(admin)/orders/actions";
import { formatOrderNumber } from "@/lib/orders/format";

type Props = {
  orderId: number;
  /** ลบแล้วไปหน้าไหน (ไม่ระบุ = อยู่หน้าเดิมแล้วโหลดข้อมูลใหม่) */
  redirectTo?: string;
  showLabel?: boolean;
};

export function DeleteOrderButton({ orderId, redirectTo, showLabel = false }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const number = formatOrderNumber(orderId);

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrder(orderId);
      if (!result.success) {
        toast.error(result.message ?? "ลบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      toast.success(`ลบออร์เดอร์ ${number} แล้ว`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {showLabel ? (
          <Button variant="outline" className="text-destructive">
            <Trash2 className="size-4" />
            ลบออร์เดอร์
          </Button>
        ) : (
          <Button variant="ghost" size="icon-lg" aria-label={`ลบออร์เดอร์ ${number}`} className="text-destructive">
            <Trash2 className="size-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ต้องการลบออร์เดอร์ {number} ใช่ไหม?</AlertDialogTitle>
          <AlertDialogDescription>ลบแล้วกู้คืนไม่ได้ ยอดของออร์เดอร์นี้จะหายไปจากหน้าภาพรวมด้วย</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          {/* ใช้ Button ธรรมดา (ไม่ใช่ AlertDialogAction) เพื่อไม่ให้กล่องปิดก่อนลบเสร็จ */}
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            ลบออร์เดอร์
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

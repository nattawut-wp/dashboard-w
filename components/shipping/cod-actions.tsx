"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Loader2, PackageX } from "lucide-react";
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
import { markCodCollected, markReturned } from "@/app/(admin)/shipping/actions";
import { formatBaht, formatOrderNumber } from "@/lib/orders/format";

type Props = { orderId: number; total: string };

/** COD ที่ส่งแล้วแต่ยังไม่ได้เงิน: "ได้รับเงินแล้ว" / "ตีกลับ" */
export function CodActions({ orderId, total }: Props) {
  const number = formatOrderNumber(orderId);
  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmButton
        icon={<Banknote className="size-4" />}
        label="ได้รับเงินแล้ว"
        title={`ได้รับเงินปลายทาง ${formatBaht(total)} ของ ${number} แล้วใช่ไหม?`}
        description="ใช้เมื่อขนส่งโอนเงินเข้าบัญชีร้านแล้ว"
        action={() => markCodCollected(orderId)}
        successMessage={`บันทึกรับเงิน ${number} แล้ว`}
      />
      <ConfirmButton
        icon={<PackageX className="size-4" />}
        label="ตีกลับ"
        variant="ghost"
        title={`${number} ตีกลับใช่ไหม?`}
        description="ลูกค้าไม่รับของ — ออร์เดอร์จะเปลี่ยนเป็น “ยกเลิก” และสินค้าจะถูกคืนเข้าคลัง (ย้อนกลับไม่ได้)"
        action={() => markReturned(orderId)}
        successMessage={`${number} ตีกลับแล้ว คืนสินค้าเข้าคลังแล้ว`}
      />
    </div>
  );
}

type ConfirmButtonProps = {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  action: () => Promise<{ success: boolean; message?: string }>;
  successMessage: string;
  variant?: "outline" | "ghost";
};

function ConfirmButton({ icon, label, title, description, action, successMessage, variant = "outline" }: ConfirmButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.message ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      toast.success(successMessage);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant={variant} size="sm">
          {icon}
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          {/* ใช้ Button ธรรมดา (ไม่ใช่ AlertDialogAction) เพื่อไม่ให้กล่องปิดก่อนบันทึกเสร็จ */}
          <Button onClick={handleConfirm} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {label}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Loader2, Trash2 } from "lucide-react";
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
import { deleteProduct, setProductActive } from "@/app/(admin)/products/actions";

type Props = {
  productId: number;
  name: string;
  isActive: boolean;
  /** จำนวนออร์เดอร์ที่เคยขาย — มากกว่า 0 ลบไม่ได้ */
  soldInOrders: number;
};

/** ปุ่มเลิกขาย / กลับมาขาย และปุ่มลบ (เฉพาะสินค้าที่ยังไม่เคยขาย) */
export function ProductStatusActions({ productId, name, isActive, soldInOrders }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const result = await setProductActive(productId, !isActive);
      if (!result.success) {
        toast.error(result.message ?? "บันทึกไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      toast.success(isActive ? `เลิกขาย “${name}” แล้ว` : `กลับมาขาย “${name}” แล้ว`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={toggleActive} disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isActive ? (
          <Archive className="size-4" />
        ) : (
          <ArchiveRestore className="size-4" />
        )}
        {isActive ? "เลิกขาย" : "กลับมาขาย"}
      </Button>
      {soldInOrders === 0 && <DeleteProductButton productId={productId} name={name} />}
    </div>
  );
}

function DeleteProductButton({ productId, name }: { productId: number; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (!result.success) {
        toast.error(result.message ?? "ลบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      toast.success(`ลบ “${name}” แล้ว`);
      setOpen(false);
      router.push("/products");
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          <Trash2 className="size-4" />
          ลบสินค้า
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ต้องการลบ “{name}” ใช่ไหม?</AlertDialogTitle>
          <AlertDialogDescription>สินค้านี้ยังไม่เคยขาย ลบได้ — ลบแล้วกู้คืนไม่ได้</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          {/* ใช้ Button ธรรมดา (ไม่ใช่ AlertDialogAction) เพื่อไม่ให้กล่องปิดก่อนลบเสร็จ */}
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            ลบสินค้า
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

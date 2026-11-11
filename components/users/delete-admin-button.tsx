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
import { deleteAdmin } from "@/app/(admin)/users/actions";
import { ACTION_TONES } from "@/components/shipping/action-tones";

export function DeleteAdminButton({ userId, name, email }: { userId: string; name: string; email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAdmin(userId);
      if (!result.success) {
        toast.error(result.message ?? "ลบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      toast.success(`ลบ ${name} แล้ว`);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg" className={ACTION_TONES.danger.trigger} aria-label={`ลบผู้ดูแล ${name}`}>
          <Trash2 className="size-4" />
          ลบ
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบผู้ดูแล {name} ใช่ไหม?</AlertDialogTitle>
          <AlertDialogDescription>
            {email} จะ login ไม่ได้อีก และหลุดจากระบบทันทีถ้ากำลังใช้งานอยู่ — ออร์เดอร์และข้อมูลอื่นไม่หาย
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          {/* ใช้ Button ธรรมดา (ไม่ใช่ AlertDialogAction) เพื่อไม่ให้กล่องปิดก่อนลบเสร็จ */}
          <Button onClick={handleDelete} disabled={pending} className={ACTION_TONES.danger.confirm}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            ลบผู้ดูแล
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

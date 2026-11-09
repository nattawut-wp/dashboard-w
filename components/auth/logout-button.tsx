"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const { error } = await authClient.signOut();
      if (error) {
        toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่");
        return;
      }
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} disabled={pending}>
      <LogOut className="size-4" />
      ออกจากระบบ
    </Button>
  );
}

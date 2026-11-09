import { CircleUser } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";

// แสดงชื่อผู้ดูแล + ปุ่มออกจากระบบ
// เรียก getCurrentUser() = เช็ค session จริง ถ้าไม่ผ่านจะพาไปหน้า login
// อ่าน cookie → ต้องวางไว้ใน <Suspense> (ดู app/(admin)/layout.tsx)
export async function UserMenu() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-1">
      <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
        <CircleUser className="size-4" />
        {user.name}
      </span>
      <LogoutButton />
    </div>
  );
}

export function UserMenuFallback() {
  return <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />;
}

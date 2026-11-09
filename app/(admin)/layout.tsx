import { Suspense } from "react";
import { Store } from "lucide-react";
import { MobileNav } from "@/components/admin/mobile-nav";
import { NavLinks, NavLinksFallback } from "@/components/admin/nav-links";
import { UserMenu, UserMenuFallback } from "@/components/auth/user-menu";

// โครงหน้าของทุกหน้าในส่วนผู้ดูแล (โฟลเดอร์ (admin) ไม่ไปโผล่ใน URL)
// จอใหญ่ (md ขึ้นไป): เมนูอยู่ด้านซ้ายตลอด / มือถือ: แถบด้านบน + ปุ่ม ☰
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-60 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4 font-semibold">
          <Store className="size-5" />
          แดชบอร์ดร้านค้า
        </div>
        <div className="p-3">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-2 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileNav />
            <span className="font-semibold">แดชบอร์ดร้านค้า</span>
          </div>
          <div className="ml-auto">
            {/* เช็ค session จริงตรงนี้ — อยู่ใน Suspense เพื่อให้โครงหน้าโหลดได้ทันทีไม่ต้องรอ */}
            <Suspense fallback={<UserMenuFallback />}>
              <UserMenu />
            </Suspense>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavLinks, NavLinksFallback } from "./nav-links";

// ปุ่มเมนู ☰ บนมือถือ กดแล้วเมนูเลื่อนออกมาจากด้านซ้าย
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="เปิดเมนู">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <SheetHeader className="p-0">
          <SheetTitle>แดชบอร์ดร้านค้า</SheetTitle>
        </SheetHeader>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks onNavigate={() => setOpen(false)} />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}

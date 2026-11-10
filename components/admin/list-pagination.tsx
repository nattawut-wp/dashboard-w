import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  /** สร้างลิงก์ของหน้าที่ต้องการ (เก็บคำค้น/ตัวกรองเดิมไว้) */
  hrefFor: (page: number) => string;
};

/** ปุ่มก่อนหน้า / ถัดไป ของหน้ารายการ — ใช้ร่วมกันทั้งออร์เดอร์และสินค้า */
export function ListPagination({ page, totalPages, hrefFor }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="เปลี่ยนหน้า" className="flex items-center justify-between gap-2">
      <PageLink href={page > 1 ? hrefFor(page - 1) : null} label="ก่อนหน้า" icon="prev" />
      <span className="text-sm text-muted-foreground">
        หน้า {page} / {totalPages}
      </span>
      <PageLink href={page < totalPages ? hrefFor(page + 1) : null} label="ถัดไป" icon="next" />
    </nav>
  );
}

function PageLink({ href, label, icon }: { href: string | null; label: string; icon: "prev" | "next" }) {
  const content = (
    <>
      {icon === "prev" && <ChevronLeft className="size-4" />}
      {label}
      {icon === "next" && <ChevronRight className="size-4" />}
    </>
  );
  if (!href) {
    return (
      <Button variant="outline" disabled>
        {content}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline">
      <Link href={href}>{content}</Link>
    </Button>
  );
}

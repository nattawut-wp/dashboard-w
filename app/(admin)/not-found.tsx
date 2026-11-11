import Link from "next/link";
import { SearchX } from "lucide-react";
import { StatusPage } from "@/components/admin/status-page";
import { Button } from "@/components/ui/button";

// ใช้เมื่อหน้าในระบบเรียก notFound() เช่น เปิดแก้ไขออร์เดอร์/สินค้าที่ถูกลบไปแล้ว — เมนูด้านข้างยังอยู่
export default function AdminNotFound() {
  return (
    <StatusPage
      icon={SearchX}
      title="ไม่พบข้อมูลนี้"
      message="ออร์เดอร์หรือสินค้านี้อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง"
    >
      <Button asChild variant="outline">
        <Link href="/orders">ไปหน้าออร์เดอร์</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/products">ไปหน้าคลังสินค้า</Link>
      </Button>
    </StatusPage>
  );
}

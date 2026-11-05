import type { Metadata } from "next";

export const metadata: Metadata = { title: "ออร์เดอร์" };

// หน้านี้ยังเป็นโครงเปล่า — ขั้น 4 จะใส่ตาราง/การ์ดออร์เดอร์ และปุ่มเพิ่ม แก้ไข ลบ
export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ออร์เดอร์</h1>
      <p className="text-muted-foreground">ยังไม่มีออร์เดอร์</p>
    </div>
  );
}

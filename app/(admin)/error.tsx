"use client"; // Error boundary ต้องเป็น Client Component

import { ErrorView } from "@/components/admin/error-view";

// ข้อผิดพลาดในหน้าระบบ (ภาพรวม / ออร์เดอร์ / คลังสินค้า / จัดส่ง) — เมนูด้านข้างยังใช้ได้
export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}

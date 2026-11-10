"use client"; // Error boundary ต้องเป็น Client Component

import { ErrorView } from "@/components/admin/error-view";

// ข้อผิดพลาดนอกหน้าระบบ (เช่น หน้า login) — เต็มหน้าจอเพราะไม่มีเมนู
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} fullScreen />;
}

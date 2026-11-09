import { createAuthClient } from "better-auth/react";

// ใช้ในหน้าเว็บ (client component) เช่น ฟอร์ม login และปุ่มออกจากระบบ
// เรียกไปที่ /api/auth ของเว็บเดียวกัน จึงไม่ต้องตั้ง baseURL
export const authClient = createAuthClient();

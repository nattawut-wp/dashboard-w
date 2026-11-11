import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./validation";

// ตั้งค่าระบบ login (ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น)
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    // ไม่เปิดให้สมัครเอง — สร้างบัญชีด้วย `npm run create-admin` หรือหน้า /users (ต้อง login ก่อน)
    disableSignUp: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // อยู่ในระบบได้ 7 วัน
    updateAge: 60 * 60 * 24, // ใช้งานทุกวัน = ต่ออายุให้อัตโนมัติ
  },

  // จำกัดการลอง login (ค่าเริ่มต้น: sign-in 3 ครั้ง / 10 วินาที)
  // เก็บในฐานข้อมูล เพราะบน Vercel แต่ละ request อาจรันคนละเครื่อง — เก็บใน memory จะนับไม่ครบ
  rateLimit: {
    enabled: true,
    storage: "database",
  },
});

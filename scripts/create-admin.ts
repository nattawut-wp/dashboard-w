// สร้างบัญชีผู้ดูแล (เว็บไม่มีหน้าสมัคร)
//   npm run create-admin -- owner@shop.com รหัสผ่านอย่างน้อย8ตัว "ชื่อที่แสดง"
// ฐานข้อมูลที่ใช้ = DATABASE_URL ใน .env (ระวัง: เช็คก่อนว่าชี้ไป environment ที่ต้องการ)
import "dotenv/config";
import { parseCreateAdminArgs } from "@/lib/auth/admin-args";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

async function main() {
  const parsed = parseCreateAdminArgs(process.argv.slice(2));
  if (!parsed.success) {
    console.error(parsed.error);
    process.exitCode = 1;
    return;
  }
  const { email, password, name } = parsed.data;

  // ใช้ฟังก์ชันภายในของ Better Auth เพราะปิดการสมัครไว้ (sign-up ถูกบล็อกทุกทาง)
  // ทำแบบเดียวกับที่ Better Auth สมัครให้: สร้าง user + ผูกบัญชี "credential" ที่เก็บรหัสผ่านที่เข้ารหัสแล้ว
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(email)) {
    console.error(`มีบัญชี ${email} อยู่แล้ว`);
    process.exitCode = 1;
    return;
  }

  const hash = await ctx.password.hash(password);
  const user = await ctx.internalAdapter.createUser(
    { email, name, emailVerified: true },
    { method: "email-password" },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: hash,
  });

  console.log(`สร้างบัญชีผู้ดูแลแล้ว: ${name} <${email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

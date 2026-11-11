// สร้างบัญชีผู้ดูแล (เว็บไม่มีหน้าสมัคร — ใช้สร้างคนแรก คนต่อไปเพิ่มที่หน้า /users ได้)
//   npm run create-admin -- owner@shop.com รหัสผ่านอย่างน้อย8ตัว "ชื่อที่แสดง"
// ฐานข้อมูลที่ใช้ = DATABASE_URL ใน .env (ระวัง: เช็คก่อนว่าชี้ไป environment ที่ต้องการ)
import "dotenv/config";
import { parseCreateAdminArgs } from "@/lib/auth/admin-args";
import { createAdminAccount } from "@/lib/auth/admins";
import { prisma } from "@/lib/prisma";

async function main() {
  const parsed = parseCreateAdminArgs(process.argv.slice(2));
  if (!parsed.success) {
    console.error(parsed.error);
    process.exitCode = 1;
    return;
  }
  const { email, password, name } = parsed.data;

  const result = await createAdminAccount({ email, password, name });
  if (!result.success) {
    console.error(`มีบัญชี ${email} อยู่แล้ว`);
    process.exitCode = 1;
    return;
  }

  console.log(`สร้างบัญชีผู้ดูแลแล้ว: ${name} <${email}>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

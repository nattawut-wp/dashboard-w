import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// สร้าง Prisma client ตัวเดียวใช้ทั้งแอป
// ตอน dev ไฟล์ถูกโหลดใหม่บ่อย จึงเก็บไว้ใน globalThis ไม่ให้เปิดการเชื่อมต่อซ้ำจนเต็ม
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

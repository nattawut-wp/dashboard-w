import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// ตั้งค่าคำสั่ง prisma (migrate, studio, seed)
// คำสั่งเหล่านี้ใช้ DIRECT_URL (ต่อตรง port 5432) เพราะ migration ใช้ผ่าน pooler ไม่ได้
// ส่วนแอปตอนทำงานใช้ DATABASE_URL (pooler) — ดู lib/prisma.ts
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});

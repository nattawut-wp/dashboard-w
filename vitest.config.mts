import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// ทดสอบเฉพาะ logic ล้วน (ไม่มี UI / ฐานข้อมูล) — ไฟล์ test อยู่คู่กับโค้ด: *.test.ts
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "generated/**"],
  },
});

// ใส่ออร์เดอร์ตัวอย่างย้อนหลัง 30 วัน ให้หน้า Dashboard มีข้อมูลไว้ดู
// รัน: npx prisma db seed            (ใส่เฉพาะตอนตารางยังว่าง)
//      npx prisma db seed -- --reset (ลบออร์เดอร์เดิมทั้งหมดแล้วใส่ใหม่)
// ห้ามรันกับฐานข้อมูล production
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { OrderStatus, PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const DAYS = 30;
const names = [
  "สมชาย ใจดี", "สมหญิง รักสวย", "วิชัย มั่นคง", "มาลี สุขใจ", "ประเสริฐ ทองคำ",
  "อรุณี แสงทอง", "ธนพล ศรีสุข", "กนกวรรณ พึ่งบุญ", "ณัฐวุฒิ เจริญผล", "พิมพ์ชนก วงศ์ดี",
];

// สุ่มแบบกำหนดค่าเริ่มต้น — รันกี่ครั้งก็ได้ข้อมูลชุดเดิม
let state = 20261105;
function random() {
  state = (state * 1664525 + 1013904223) % 2 ** 32;
  return state / 2 ** 32;
}
const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)];

function randomStatus(daysAgo: number): OrderStatus {
  const r = random();
  if (r < 0.08) return OrderStatus.CANCELLED;
  if (daysAgo <= 1 && r < 0.4) return OrderStatus.PENDING; // ออร์เดอร์ใหม่ยังรอชำระ
  if (daysAgo <= 3 && r < 0.7) return OrderStatus.PAID;
  return OrderStatus.SHIPPED;
}

async function main() {
  const reset = process.argv.includes("--reset");
  const existing = await prisma.order.count();

  if (existing > 0 && !reset) {
    console.log(`มีออร์เดอร์อยู่แล้ว ${existing} รายการ — ไม่ใส่ซ้ำ (ใช้ --reset ถ้าต้องการล้างแล้วใส่ใหม่)`);
    return;
  }
  if (reset) {
    const { count } = await prisma.order.deleteMany();
    console.log(`ลบออร์เดอร์เดิม ${count} รายการ`);
  }

  const now = Date.now();
  const data = [];
  for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
    const perDay = 2 + Math.floor(random() * 7); // 2–8 ออร์เดอร์ต่อวัน
    for (let i = 0; i < perDay; i++) {
      // สุ่มเวลาในวันนั้น แต่ไม่เกินเวลาปัจจุบัน
      const orderedAt = new Date(
        Math.min(now, now - daysAgo * 86_400_000 - Math.floor(random() * 86_400_000)),
      );
      data.push({
        customerName: pick(names),
        customerPhone: random() < 0.7 ? `08${Math.floor(10_000_000 + random() * 89_999_999)}` : null,
        total: (Math.round((150 + random() * 2850) * 100) / 100).toFixed(2),
        status: randomStatus(daysAgo),
        orderedAt,
        note: random() < 0.15 ? "ฝากไว้หน้าบ้าน" : null,
      });
    }
  }

  data.sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());
  const { count } = await prisma.order.createMany({ data });
  console.log(`ใส่ออร์เดอร์ตัวอย่าง ${count} รายการ (ย้อนหลัง ${DAYS} วัน)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

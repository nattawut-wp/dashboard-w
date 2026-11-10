// ใส่ข้อมูลตัวอย่าง: สินค้า + ออร์เดอร์ย้อนหลัง 30 วัน (มีรายการสินค้า ที่อยู่ และเลขพัสดุ)
// รัน: npx prisma db seed            (ใส่เฉพาะตอนยังไม่มีสินค้าและออร์เดอร์)
//      npx prisma db seed -- --reset (ลบสินค้าและออร์เดอร์เดิมทั้งหมดแล้วใส่ใหม่ — บัญชีแอดมินไม่ถูกแตะ)
// ห้ามรันกับฐานข้อมูล production
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { OrderStatus, PrismaClient, ShippingCarrier } from "../generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const DAYS = 30;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const names = [
  "สมชาย ใจดี", "สมหญิง รักสวย", "วิชัย มั่นคง", "มาลี สุขใจ", "ประเสริฐ ทองคำ",
  "อรุณี แสงทอง", "ธนพล ศรีสุข", "กนกวรรณ พึ่งบุญ", "ณัฐวุฒิ เจริญผล", "พิมพ์ชนก วงศ์ดี",
];

const addresses = [
  "99/12 ถ.สุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110",
  "45 หมู่ 3 ต.บ้านใหม่ อ.ปากเกร็ด จ.นนทบุรี 11120",
  "128/7 ถ.นิมมานเหมินท์ ต.สุเทพ อ.เมืองเชียงใหม่ จ.เชียงใหม่ 50200",
  "7 ซ.ลาดพร้าว 71 แขวงสะพานสอง เขตวังทองหลาง กรุงเทพฯ 10310",
  "300 หมู่ 1 ต.ในเมือง อ.เมืองขอนแก่น จ.ขอนแก่น 40000",
  "56/3 ถ.กาญจนวนิช ต.หาดใหญ่ อ.หาดใหญ่ จ.สงขลา 90110",
  "18 ถ.มิตรภาพ ต.ในเมือง อ.เมืองนครราชสีมา จ.นครราชสีมา 30000",
  "211 ถ.เพชรเกษม แขวงบางหว้า เขตภาษีเจริญ กรุงเทพฯ 10160",
];

// สินค้าตัวอย่าง — stock คือ "คงเหลือหลังขาย" (ตั้งให้บางตัวใกล้หมด/หมด เพื่อให้เห็นป้ายเตือน)
const products = [
  { sku: "TS-WHT-M", name: "เสื้อยืดคอกลม สีขาว ไซซ์ M", price: "199.00", stock: 42 },
  { sku: "TS-BLK-L", name: "เสื้อยืดคอกลม สีดำ ไซซ์ L", price: "199.00", stock: 3 },
  { sku: "HD-GRY-L", name: "เสื้อฮู้ด สีเทา ไซซ์ L", price: "590.00", stock: 12 },
  { sku: "CAP-NVY", name: "หมวกแก๊ป สีกรม", price: "250.00", stock: 0 },
  { sku: "BAG-TOTE", name: "กระเป๋าผ้าแคนวาส", price: "159.00", stock: 65 },
  { sku: "MUG-CER", name: "แก้วมัคเซรามิก 350 มล.", price: "189.00", stock: 24 },
  { sku: "BTL-STL", name: "กระบอกน้ำสแตนเลส 500 มล.", price: "349.00", stock: 5 },
  { sku: "NB-A5", name: "สมุดโน้ต A5 ปกแข็ง", price: "89.00", stock: 120 },
  { sku: "PEN-GEL3", name: "ปากกาเจล แพ็ก 3 ด้าม", price: "45.00", stock: 200 },
  { sku: "STK-SET", name: "สติกเกอร์ไดคัท ชุด 10 ชิ้น", price: "69.00", stock: 2 },
  { sku: "PHC-CLR", name: "เคสโทรศัพท์ใส", price: "129.00", stock: 38 },
  { sku: "CBL-USBC", name: "สายชาร์จ USB-C 1 เมตร", price: "159.00", stock: 0 },
  { sku: "SOCK-3P", name: "ถุงเท้าข้อสั้น แพ็ก 3 คู่", price: "99.00", stock: 54 },
  { sku: "KEY-ACR", name: "พวงกุญแจอะคริลิก", price: "59.00", stock: 17 },
  { sku: "UMB-FLD", name: "ร่มพับ กันยูวี", price: "299.00", stock: 8, isActive: false }, // เลิกขายแล้ว
];

// สุ่มแบบกำหนดค่าเริ่มต้น — รันกี่ครั้งก็ได้ข้อมูลชุดเดิม
let state = 20261110;
function random() {
  state = (state * 1664525 + 1013904223) % 2 ** 32;
  return state / 2 ** 32;
}
const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
const digits = (length: number) =>
  Array.from({ length }, () => Math.floor(random() * 10)).join("");

function randomStatus(daysAgo: number): OrderStatus {
  const r = random();
  if (r < 0.08) return OrderStatus.CANCELLED;
  if (daysAgo <= 1 && r < 0.4) return OrderStatus.PENDING; // ออร์เดอร์ใหม่ยังรอชำระ
  if (daysAgo <= 3 && r < 0.7) return OrderStatus.PAID; // ชำระแล้ว รอส่ง
  return OrderStatus.SHIPPED;
}

function trackingNumber(carrier: ShippingCarrier): string {
  switch (carrier) {
    case ShippingCarrier.KERRY:
      return `KEX${digits(10)}`;
    case ShippingCarrier.FLASH:
      return `TH${digits(12)}`;
    case ShippingCarrier.JT:
      return digits(12);
    case ShippingCarrier.THAILAND_POST:
      return `EY${digits(9)}TH`;
    default:
      return `SHIP${digits(8)}`;
  }
}

/** "199.00" → 19900 สตางค์ — คิดเงินเป็นจำนวนเต็ม ทศนิยมไม่เพี้ยน */
const toSatang = (price: string) => Math.round(Number(price) * 100);
const fromSatang = (satang: number) => (satang / 100).toFixed(2);

async function main() {
  const reset = process.argv.includes("--reset");
  const [existingOrders, existingProducts] = await Promise.all([
    prisma.order.count(),
    prisma.product.count(),
  ]);

  if ((existingOrders > 0 || existingProducts > 0) && !reset) {
    console.log(
      `มีข้อมูลอยู่แล้ว (ออร์เดอร์ ${existingOrders}, สินค้า ${existingProducts}) — ไม่ใส่ซ้ำ ` +
        "(ใช้ --reset ถ้าต้องการล้างแล้วใส่ใหม่)",
    );
    return;
  }
  if (reset) {
    // ลบออร์เดอร์ก่อน (รายการในออร์เดอร์ถูกลบตาม) แล้วค่อยลบสินค้า
    const orders = await prisma.order.deleteMany();
    const removed = await prisma.product.deleteMany();
    console.log(`ลบออร์เดอร์เดิม ${orders.count} รายการ และสินค้าเดิม ${removed.count} รายการ`);
  }

  await prisma.product.createMany({ data: products });
  const saved = await prisma.product.findMany({ orderBy: { id: "asc" } });
  const sellable = saved.filter((product) => product.isActive);
  const carriers = Object.values(ShippingCarrier);

  const now = Date.now();
  const orders = [];
  for (let daysAgo = DAYS - 1; daysAgo >= 0; daysAgo--) {
    const perDay = 2 + Math.floor(random() * 7); // 2–8 ออร์เดอร์ต่อวัน
    for (let i = 0; i < perDay; i++) {
      // สุ่มเวลาในวันนั้น แต่ไม่เกินเวลาปัจจุบัน
      const orderedAt = new Date(
        Math.min(now, now - daysAgo * DAY - Math.floor(random() * DAY)),
      );
      const status = randomStatus(daysAgo);

      // 1–3 รายการ สินค้าไม่ซ้ำกันในออร์เดอร์เดียว ส่วนใหญ่ซื้อชิ้นเดียว
      const lineCount = 1 + Math.floor(random() * random() * 3.5);
      const chosen = new Map<number, (typeof sellable)[number]>();
      while (chosen.size < lineCount) {
        const product = pick(sellable);
        chosen.set(product.id, product);
      }
      const items = [...chosen.values()].map((product) => ({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price.toFixed(2),
        quantity: random() < 0.75 ? 1 : 2 + Math.floor(random() * 2),
      }));
      const totalSatang = items.reduce(
        (sum, item) => sum + toSatang(item.unitPrice) * item.quantity,
        0,
      );

      const shipped = status === OrderStatus.SHIPPED;
      const carrier = shipped ? pick(carriers) : null;
      orders.push({
        customerName: pick(names),
        customerPhone: random() < 0.7 ? `08${digits(8)}` : null,
        total: fromSatang(totalSatang),
        status,
        orderedAt,
        note: random() < 0.15 ? "ฝากไว้หน้าบ้าน" : null,
        // ส่งแล้วต้องมีที่อยู่เสมอ ที่เหลือบางออร์เดอร์ยังไม่ได้กรอก
        shippingAddress: shipped || random() < 0.85 ? pick(addresses) : null,
        shippingCarrier: carrier,
        trackingNumber: carrier ? trackingNumber(carrier) : null,
        shippedAt: shipped
          ? new Date(Math.min(now, orderedAt.getTime() + 4 * HOUR + Math.floor(random() * 26 * HOUR)))
          : null,
        items,
      });
    }
  }

  // เรียงตามเวลาที่สั่ง ให้เลขออร์เดอร์เรียงตามวันเหมือนของจริง
  const sorted = [...orders].sort((a, b) => a.orderedAt.getTime() - b.orderedAt.getTime());
  // สร้างทีละออร์เดอร์พร้อมรายการ ในก้อนเดียว (ถ้าพังกลางทาง ไม่มีข้อมูลครึ่งๆ กลางๆ)
  // ฐานข้อมูลอยู่สิงคโปร์ ~160 คำสั่งใช้เวลาเกิน 5 วินาทีที่ Prisma ตั้งไว้ จึงขยายเวลาให้
  await prisma.$transaction(
    async (tx) => {
      for (const { items, ...order } of sorted) {
        await tx.order.create({ data: { ...order, items: { create: items } } });
      }
    },
    { timeout: 120_000, maxWait: 10_000 },
  );

  const itemCount = orders.reduce((sum, order) => sum + order.items.length, 0);
  console.log(`ใส่สินค้าตัวอย่าง ${saved.length} รายการ (เลิกขาย ${saved.length - sellable.length})`);
  console.log(`ใส่ออร์เดอร์ตัวอย่าง ${orders.length} รายการ (${itemCount} รายการสินค้า, ย้อนหลัง ${DAYS} วัน)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

import { describe, expect, it } from "vitest";
import { dailySales, summarizeSales, toSatang } from "./sales";

describe("toSatang (บาท → สตางค์ เป็นจำนวนเต็ม — บวกกันไม่เพี้ยน)", () => {
  it("ทศนิยม 2 / 1 / 0 ตำแหน่ง, 0, ค่าต่ำสุด", () => {
    expect(toSatang("1250.50")).toBe(125050);
    expect(toSatang("1250.5")).toBe(125050);
    expect(toSatang("1250")).toBe(125000);
    expect(toSatang("0")).toBe(0);
    expect(toSatang("0.01")).toBe(1);
    expect(toSatang("0.29")).toBe(29); // 0.29 * 100 = 28.999999999999996 ถ้าคูณตรงๆ
  });

  it("ค่าที่อ่านไม่ได้ / ว่าง → 0 (ไม่ทำให้ยอดรวมเป็น NaN)", () => {
    expect(toSatang("abc")).toBe(0);
    expect(toSatang("")).toBe(0);
  });
});

// 10 พ.ย. 2569 15:00 ไทย
const NOW = new Date("2026-11-10T08:00:00Z");
const sale = (status: string, orderedAt: string, total: string) => ({
  status: status as "PENDING" | "PAID" | "SHIPPED" | "CANCELLED",
  orderedAt: new Date(orderedAt),
  total,
});

describe("summarizeSales (การ์ดสรุป — หน่วยสตางค์)", () => {
  it("นับเฉพาะชำระแล้ว + จัดส่งแล้ว (COD นับเมื่อส่ง) — รอชำระ / ยกเลิก ไม่นับ", () => {
    const orders = [
      sale("PAID", "2026-11-10T02:00:00Z", "100.00"),
      sale("SHIPPED", "2026-11-10T03:00:00Z", "250.50"),
      sale("PENDING", "2026-11-10T04:00:00Z", "999.00"), // โอนยังไม่จ่าย / COD ยังไม่ส่ง
      sale("CANCELLED", "2026-11-10T05:00:00Z", "999.00"),
    ];
    expect(summarizeSales(orders, NOW)).toEqual({
      today: { total: 35050, count: 2 },
      month: { total: 35050, count: 2, average: 17525 },
    });
  });

  it("ขอบเวลา: 23:59 เมื่อคืน (ไทย) ไม่ใช่วันนี้แต่อยู่เดือนนี้ / 31 ต.ค. 23:59 ไทย ไม่อยู่เดือนนี้ / เฉลี่ยปัดเป็นสตางค์", () => {
    const orders = [
      sale("PAID", "2026-11-09T16:59:00Z", "100.00"), // 9 พ.ย. 23:59 ไทย
      sale("PAID", "2026-11-09T17:00:00Z", "100.01"), // 10 พ.ย. 00:00 ไทย
      sale("PAID", "2026-10-31T16:59:00Z", "500.00"), // 31 ต.ค. 23:59 ไทย
      sale("PAID", "2026-10-31T17:00:00Z", "100.00"), // 1 พ.ย. 00:00 ไทย
    ];
    expect(summarizeSales(orders, NOW)).toEqual({
      today: { total: 10001, count: 1 },
      month: { total: 30001, count: 3, average: 10000 }, // 30001 / 3 = 10000.33
    });
  });

  it("ไม่มียอดขายเลย → 0 และยอดเฉลี่ยเป็น null (ไม่หารด้วยศูนย์)", () => {
    expect(summarizeSales([], NOW)).toEqual({
      today: { total: 0, count: 0 },
      month: { total: 0, count: 0, average: null },
    });
  });
});

describe("dailySales (กราฟรายวัน)", () => {
  it("รวมตามวัน (เวลาไทย), วันที่ไม่มีขาย = 0, ไม่นับรอชำระ/ยกเลิก/นอกช่วง", () => {
    const orders = [
      sale("PAID", "2026-11-09T16:59:00Z", "100.00"), // 9 พ.ย. 23:59 ไทย
      sale("SHIPPED", "2026-11-09T17:00:00Z", "0.10"), // 10 พ.ย. 00:00 ไทย
      sale("PAID", "2026-11-10T07:00:00Z", "0.20"), // 10 พ.ย. → รวม 0.30 พอดี (ไม่ใช่ 0.30000000000000004)
      sale("CANCELLED", "2026-11-10T07:00:00Z", "999.00"),
      sale("PENDING", "2026-11-08T07:00:00Z", "999.00"),
      sale("PAID", "2026-11-01T07:00:00Z", "999.00"), // นอกช่วง 3 วัน
    ];
    expect(dailySales(orders, NOW, 3)).toEqual([
      { date: "2026-11-08", total: 0, count: 0 },
      { date: "2026-11-09", total: 100, count: 1 },
      { date: "2026-11-10", total: 0.3, count: 2 },
    ]);
  });

  it("ไม่มีออร์เดอร์ → ทุกวันเป็น 0 (กราฟยังแสดงแกนครบ 30 วัน)", () => {
    const days = dailySales([], NOW, 30);
    expect(days).toHaveLength(30);
    expect(days.every((day) => day.total === 0 && day.count === 0)).toBe(true);
  });
});

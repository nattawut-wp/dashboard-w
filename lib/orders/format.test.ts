import { describe, expect, it } from "vitest";
import { formatBaht, formatOrderNumber, formatThaiDateTime, formatThaiPhone } from "./format";

describe("formatThaiPhone", () => {
  it("มือถือ 10 หลัก → 080-671-8527", () => {
    expect(formatThaiPhone("0806718527")).toBe("080-671-8527");
  });

  it("เบอร์บ้าน 9 หลัก → 02-123-4567", () => {
    expect(formatThaiPhone("021234567")).toBe("02-123-4567");
  });

  it("ไม่มีเบอร์ (null / undefined / ว่าง) → '—'", () => {
    expect(formatThaiPhone(null)).toBe("—");
    expect(formatThaiPhone(undefined)).toBe("—");
    expect(formatThaiPhone("")).toBe("—");
    expect(formatThaiPhone("   ")).toBe("—");
  });

  it("รูปแบบอื่น (ข้อมูลเก่าที่ไม่ตรงกฎ) → แสดงตามเดิม ไม่ใส่ขีดมั่ว", () => {
    for (const phone of ["1234567890", "123456789", "08123456", "08123456789", "080-671-8527", "+66806718527"]) {
      expect(formatThaiPhone(phone)).toBe(phone);
    }
  });
});

describe("formatThaiDateTime", () => {
  it("แสดงตามเวลาไทย (UTC+7) แบบ วัน เดือนย่อ ปี พ.ศ. ชั่วโมง:นาที", () => {
    expect(formatThaiDateTime(new Date("2026-11-09T07:30:00Z"))).toBe("9 พ.ย. 2569 14:30");
  });

  describe("กรณีขอบ", () => {
    it("เที่ยงคืนเวลาไทย = 17:00 UTC ของวันก่อน → เป็นวันใหม่ 00:00", () => {
      expect(formatThaiDateTime(new Date("2026-11-08T17:00:00Z"))).toBe("9 พ.ย. 2569 00:00");
    });

    it("1 นาทีก่อนเที่ยงคืนไทย → ยังเป็นวันเดิม 23:59", () => {
      expect(formatThaiDateTime(new Date("2026-11-08T16:59:00Z"))).toBe("8 พ.ย. 2569 23:59");
    });

    it("วันที่ไม่ถูกต้อง → '—'", () => {
      expect(formatThaiDateTime(new Date("not a date"))).toBe("—");
    });
  });
});

describe("formatOrderNumber", () => {
  it("เลข id → # + เติม 0 ข้างหน้าให้ครบ 6 หลัก", () => {
    expect(formatOrderNumber(123)).toBe("#000123");
  });

  it("กรณีขอบ: เกิน 6 หลักไม่ตัดทิ้ง, 1 หลัก, 0/ติดลบ/ทศนิยม (id ไม่มีจริง) → '—'", () => {
    expect(formatOrderNumber(1234567)).toBe("#1234567");
    expect(formatOrderNumber(1)).toBe("#000001");
    expect(formatOrderNumber(0)).toBe("—");
    expect(formatOrderNumber(-5)).toBe("—");
    expect(formatOrderNumber(1.5)).toBe("—");
  });
});

describe("formatBaht", () => {
  it("ตัวเลข → ฿ มีคอมมาและทศนิยม 2 ตำแหน่ง", () => {
    expect(formatBaht(1234)).toBe("฿1,234.00");
  });

  it("Decimal จาก Prisma / ข้อความตัวเลข → แสดงได้", () => {
    const decimalLike = { toString: () => "1250.5" }; // หน้าตาเหมือน Prisma.Decimal
    expect(formatBaht("1250.5")).toBe("฿1,250.50");
    expect(formatBaht(decimalLike)).toBe("฿1,250.50");
  });

  it("ไม่มีค่า / ไม่ใช่ตัวเลข → '—' (ไม่ใช่ ฿NaN)", () => {
    expect(formatBaht(null)).toBe("—");
    expect(formatBaht(undefined)).toBe("—");
    expect(formatBaht("abc")).toBe("—");
    expect(formatBaht(Number.NaN)).toBe("—");
  });

  describe("กรณีขอบ", () => {
    it("0 → ฿0.00", () => {
      expect(formatBaht(0)).toBe("฿0.00");
      expect(formatBaht("0.00")).toBe("฿0.00");
    });

    it("ค่าติดลบ → มีเครื่องหมายลบ", () => {
      expect(formatBaht(-50)).toBe("-฿50.00");
    });

    it("ข้อความว่าง / มีแต่ช่องว่าง → '—' (ไม่ใช่ ฿0.00)", () => {
      expect(formatBaht("")).toBe("—");
      expect(formatBaht("  ")).toBe("—");
    });

    it("หลักล้าน", () => {
      expect(formatBaht("1234567.89")).toBe("฿1,234,567.89");
    });
  });
});

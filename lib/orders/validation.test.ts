import { describe, expect, it } from "vitest";
import { parseOrderForm } from "./validation";

const NOW = new Date("2026-11-09T10:00:00Z"); // 17:00 เวลาไทย

/** ฟอร์มที่กรอกถูกต้องครบ — แต่ละ test เปลี่ยนเฉพาะช่องที่สนใจ */
function form(overrides: Record<string, unknown> = {}) {
  return {
    customerName: "สมชาย ใจดี",
    customerPhone: "0812345678",
    total: "1250.50",
    status: "PAID",
    orderedAt: "2026-11-09T14:30",
    note: "ฝากไว้หน้าบ้าน",
    shippingAddress: "99/12 ถ.สุขุมวิท กรุงเทพฯ 10110",
    paymentMethod: "TRANSFER",
    ...overrides,
  };
}

describe("parseOrderForm", () => {
  it("กรอกถูกต้องครบ → ได้ข้อมูลพร้อมบันทึก", () => {
    expect(parseOrderForm(form(), NOW)).toEqual({
      success: true,
      data: {
        customerName: "สมชาย ใจดี",
        customerPhone: "0812345678",
        total: "1250.50",
        status: "PAID",
        orderedAt: new Date("2026-11-09T07:30:00Z"),
        note: "ฝากไว้หน้าบ้าน",
        shippingAddress: "99/12 ถ.สุขุมวิท กรุงเทพฯ 10110",
        paymentMethod: "TRANSFER",
      },
    });
  });

  describe("ชื่อลูกค้า", () => {
    it("ว่าง / มีแต่ช่องว่าง / null → 'กรุณากรอกชื่อลูกค้า'", () => {
      for (const customerName of ["", "   ", null]) {
        expect(parseOrderForm(form({ customerName }), NOW)).toEqual({
          success: false,
          errors: { customerName: "กรุณากรอกชื่อลูกค้า" },
        });
      }
    });

    it("100 ตัวผ่าน / 101 ตัว → 'ชื่อลูกค้ายาวเกิน 100 ตัวอักษร', ตัดช่องว่างหน้า-หลัง", () => {
      expect(parseOrderForm(form({ customerName: "ก".repeat(100) }), NOW).success).toBe(true);
      expect(parseOrderForm(form({ customerName: "ก".repeat(101) }), NOW)).toEqual({
        success: false,
        errors: { customerName: "ชื่อลูกค้ายาวเกิน 100 ตัวอักษร" },
      });
      const trimmed = parseOrderForm(form({ customerName: "  มาลี  " }), NOW);
      expect(trimmed.success && trimmed.data.customerName).toBe("มาลี");
    });
  });

  describe("เบอร์โทร", () => {
    it("ไม่บังคับ: ว่าง / ช่องว่าง / null → บันทึกเป็น null", () => {
      for (const customerPhone of ["", "  ", null]) {
        const result = parseOrderForm(form({ customerPhone }), NOW);
        expect(result.success && result.data.customerPhone).toBeNull();
      }
    });

    it("เบอร์ไทย 9–10 หลักขึ้นต้น 0 ผ่าน (ตัดขีด/ช่องว่างให้)", () => {
      const cases: Record<string, string> = {
        "081-234-5678": "0812345678",
        "081 234 5678": "0812345678",
        "021234567": "021234567", // เบอร์บ้าน 9 หลัก
      };
      for (const [typed, saved] of Object.entries(cases)) {
        const result = parseOrderForm(form({ customerPhone: typed }), NOW);
        expect(result.success && result.data.customerPhone).toBe(saved);
      }
    });

    it("รูปแบบอื่น → 'เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก ขึ้นต้นด้วย 0'", () => {
      // 8 หลัก, 11 หลัก, ไม่ขึ้นต้น 0, มีตัวอักษร, +66
      for (const customerPhone of ["08123456", "08123456789", "8123456789", "081234567a", "+66812345678"]) {
        expect(parseOrderForm(form({ customerPhone }), NOW)).toEqual({
          success: false,
          errors: { customerPhone: "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก ขึ้นต้นด้วย 0" },
        });
      }
    });
  });

  describe("ยอดรวม", () => {
    const totalError = (total: unknown) => {
      const result = parseOrderForm(form({ total }), NOW);
      return result.success ? null : result.errors.total;
    };

    it("ว่าง / null → 'กรุณากรอกยอดรวม'", () => {
      expect(totalError("")).toBe("กรุณากรอกยอดรวม");
      expect(totalError("  ")).toBe("กรุณากรอกยอดรวม");
      expect(totalError(null)).toBe("กรุณากรอกยอดรวม");
    });

    it("มีคอมมา / ไม่มีทศนิยม / ทศนิยม 1 ตำแหน่ง → บันทึกเป็นทศนิยม 2 ตำแหน่ง", () => {
      const saved = (total: string) => {
        const result = parseOrderForm(form({ total }), NOW);
        return result.success ? result.data.total : result.errors.total;
      };
      expect(saved("1,250")).toBe("1250.00");
      expect(saved("1,234,567.5")).toBe("1234567.50");
      expect(saved("99")).toBe("99.00");
    });

    it("ไม่ใช่ตัวเลข / ทศนิยมเกิน 2 ตำแหน่ง → แจ้งรูปแบบผิด", () => {
      const message = "ยอดรวมต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง";
      for (const total of ["abc", "12.345", "1.2.3", "1e5", "฿100", "12.", ".5"]) {
        expect(totalError(total)).toBe(message);
      }
    });

    it("0 / ติดลบ → 'ยอดรวมต้องมากกว่า 0', 0.01 (ต่ำสุด) ผ่าน", () => {
      for (const total of ["0", "0.00", "-5", "-0.01"]) {
        expect(totalError(total)).toBe("ยอดรวมต้องมากกว่า 0");
      }
      expect(totalError("0.01")).toBeNull();
    });

    it("สูงสุดที่ฐานข้อมูลเก็บได้ (Decimal 12,2) ผ่าน / เกิน → 'ยอดรวมสูงเกินไป'", () => {
      expect(totalError("9,999,999,999.99")).toBeNull();
      expect(totalError("10000000000")).toBe("ยอดรวมสูงเกินไป");
      expect(totalError("00000000000001.00")).toBeNull(); // 0 นำหน้าไม่นับเป็นหลัก
    });
  });

  describe("สถานะ", () => {
    it("ไม่มีจริง / ว่าง / null / ตัวเล็ก → 'กรุณาเลือกสถานะ'", () => {
      for (const status of ["REFUNDED", "", null, "paid"]) {
        expect(parseOrderForm(form({ status }), NOW)).toEqual({
          success: false,
          errors: { status: "กรุณาเลือกสถานะ" },
        });
      }
    });
  });

  describe("วันเวลาที่สั่ง", () => {
    const orderedAtError = (orderedAt: unknown) => {
      const result = parseOrderForm(form({ orderedAt }), NOW);
      return result.success ? null : result.errors.orderedAt;
    };

    it("ว่าง / null / รูปแบบผิด / วันที่ไม่มีจริง → 'กรุณาระบุวันเวลาที่สั่งให้ถูกต้อง'", () => {
      for (const orderedAt of ["", null, "พรุ่งนี้", "2026-02-30T10:00"]) {
        expect(orderedAtError(orderedAt)).toBe("กรุณาระบุวันเวลาที่สั่งให้ถูกต้อง");
      }
    });

    it("ตรงเวลาปัจจุบันพอดีผ่าน / อนาคต 1 นาที → 'วันเวลาที่สั่งต้องไม่อยู่ในอนาคต'", () => {
      // NOW = 17:00 เวลาไทย
      expect(orderedAtError("2026-11-09T17:00")).toBeNull();
      expect(orderedAtError("2026-11-09T17:01")).toBe("วันเวลาที่สั่งต้องไม่อยู่ในอนาคต");
      expect(orderedAtError("2027-01-01T00:00")).toBe("วันเวลาที่สั่งต้องไม่อยู่ในอนาคต");
    });
  });

  describe("หมายเหตุ", () => {
    it("ไม่บังคับ: ว่าง / null → null, 500 ตัวผ่าน / 501 ตัว → 'หมายเหตุยาวเกิน 500 ตัวอักษร'", () => {
      const parse = (note: unknown) => parseOrderForm(form({ note }), NOW);
      for (const note of ["", "   ", null]) {
        const result = parse(note);
        expect(result.success && result.data.note).toBeNull();
      }
      expect(parse("ก".repeat(500)).success).toBe(true);
      expect(parse("ก".repeat(501))).toEqual({
        success: false,
        errors: { note: "หมายเหตุยาวเกิน 500 ตัวอักษร" },
      });
    });
  });

  describe("ที่อยู่จัดส่ง", () => {
    it("ไม่บังคับ: ว่าง / null → null, ตัดช่องว่างหน้า-หลัง, ขึ้นบรรทัดใหม่ได้, 500 ตัวผ่าน / 501 ตัว → 'ที่อยู่จัดส่งยาวเกิน 500 ตัวอักษร'", () => {
      const parse = (shippingAddress: unknown) => parseOrderForm(form({ shippingAddress }), NOW);
      for (const shippingAddress of ["", "   ", null]) {
        const result = parse(shippingAddress);
        expect(result.success && result.data.shippingAddress).toBeNull();
      }
      const multiLine = parse("  45 หมู่ 3\nนนทบุรี 11120  ");
      expect(multiLine.success && multiLine.data.shippingAddress).toBe("45 หมู่ 3\nนนทบุรี 11120");
      expect(parse("ก".repeat(500)).success).toBe(true);
      expect(parse("ก".repeat(501))).toEqual({
        success: false,
        errors: { shippingAddress: "ที่อยู่จัดส่งยาวเกิน 500 ตัวอักษร" },
      });
    });
  });

  describe("วิธีชำระเงิน", () => {
    it("โอนเงิน / เก็บเงินปลายทาง ผ่าน, อื่นๆ / ว่าง / null / ตัวเล็ก → 'กรุณาเลือกวิธีชำระเงิน'", () => {
      const result = parseOrderForm(form({ paymentMethod: "COD" }), NOW);
      expect(result.success && result.data.paymentMethod).toBe("COD");
      for (const paymentMethod of ["CASH", "", null, "cod"]) {
        expect(parseOrderForm(form({ paymentMethod }), NOW)).toEqual({
          success: false,
          errors: { paymentMethod: "กรุณาเลือกวิธีชำระเงิน" },
        });
      }
    });
  });

  describe("กรณีขอบรวม", () => {
    it("ผิดหลายช่อง → แจ้งทุกช่องพร้อมกัน (ช่องละ 1 ข้อความ)", () => {
      expect(
        parseOrderForm(
          form({ customerName: "", total: "-1", status: "X", orderedAt: "" }),
          NOW,
        ),
      ).toEqual({
        success: false,
        errors: {
          customerName: "กรุณากรอกชื่อลูกค้า",
          total: "ยอดรวมต้องมากกว่า 0",
          status: "กรุณาเลือกสถานะ",
          orderedAt: "กรุณาระบุวันเวลาที่สั่งให้ถูกต้อง",
        },
      });
    });

    it("ค่าเป็นไฟล์ (FormData ส่งไฟล์มาได้) → ไม่ผ่าน ไม่พัง", () => {
      const file = new File(["x"], "x.txt");
      const result = parseOrderForm(form({ customerName: file, note: file }), NOW);
      expect(result.success).toBe(false);
      expect(!result.success && Object.keys(result.errors).sort()).toEqual(["customerName", "note"]);
    });

    it("เบอร์โทรมีแต่ขีด → ไม่ผ่าน (ไม่ใช่กลายเป็นว่าง)", () => {
      expect(parseOrderForm(form({ customerPhone: "---" }), NOW)).toEqual({
        success: false,
        errors: { customerPhone: "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก ขึ้นต้นด้วย 0" },
      });
    });
  });
});

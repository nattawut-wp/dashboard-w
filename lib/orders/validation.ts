import { z } from "zod";
import { firstErrorPerField } from "@/lib/auth/validation";
import { parseBangkokDateTimeInput } from "./datetime";
import { ORDER_STATUSES } from "./status";

// เบอร์มือถือ 10 หลัก (08x, 09x, 06x) หรือเบอร์บ้าน 9 หลัก (02x ...)
const THAI_PHONE = /^0\d{8,9}$/;

// ตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง (ไม่รับ 1e5, .5, 12.)
const MONEY = /^\d+(\.\d{1,2})?$/;
const MAX_WHOLE_DIGITS = 10; // ตรงกับ total Decimal(12, 2) ใน prisma/schema.prisma

function moneyError(value: string): string | null {
  // ติดลบที่รูปแบบถูก → บอกว่าต้องมากกว่า 0 (ชัดกว่าบอกว่ารูปแบบผิด)
  if (value.startsWith("-") && MONEY.test(value.slice(1))) return "ยอดรวมต้องมากกว่า 0";
  if (!MONEY.test(value)) return "ยอดรวมต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง";
  if (/^[0.]+$/.test(value)) return "ยอดรวมต้องมากกว่า 0";
  // Decimal(12,2) = จำนวนเต็มได้ไม่เกิน 10 หลัก (ไม่นับ 0 นำหน้า)
  const wholeDigits = value.split(".")[0].replace(/^0+/, "");
  if (wholeDigits.length > MAX_WHOLE_DIGITS) return "ยอดรวมสูงเกินไป";
  return null;
}

/** "1,250.5" → "1250.50" — ทำกับข้อความล้วน ไม่แปลงเป็น number เพื่อไม่ให้ทศนิยมเพี้ยน */
function normalizeMoney(value: string): string {
  const [whole, fraction = ""] = value.replace(/,/g, "").split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

/** ช่องไม่บังคับ: ว่าง / มีแต่ช่องว่าง / ไม่ส่งมา → null */
function optionalText() {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() || null : (value ?? null)),
    z.string().nullable(),
  );
}

function orderSchema(now: Date) {
  return z.object({
    customerName: z
      .string({ error: "กรุณากรอกชื่อลูกค้า" })
      .trim()
      .min(1, "กรุณากรอกชื่อลูกค้า")
      .max(100, "ชื่อลูกค้ายาวเกิน 100 ตัวอักษร"),
    customerPhone: optionalText().pipe(
      z
        .string()
        .transform((phone) => phone.replace(/[\s-]/g, ""))
        .refine((phone) => THAI_PHONE.test(phone), "เบอร์โทรต้องเป็นตัวเลข 9–10 หลัก ขึ้นต้นด้วย 0")
        .nullable(),
    ),
    total: z
      .string({ error: "กรุณากรอกยอดรวม" })
      .trim()
      .min(1, "กรุณากรอกยอดรวม")
      .superRefine((value, ctx) => {
        const error = moneyError(value.replace(/,/g, ""));
        if (error) ctx.addIssue({ code: "custom", message: error });
      })
      .transform(normalizeMoney),
    status: z.enum(ORDER_STATUSES, { error: "กรุณาเลือกสถานะ" }),
    orderedAt: z.preprocess(
      (value) => parseBangkokDateTimeInput(typeof value === "string" ? value : null),
      z
        .date({ error: "กรุณาระบุวันเวลาที่สั่งให้ถูกต้อง" })
        .max(now, "วันเวลาที่สั่งต้องไม่อยู่ในอนาคต"),
    ),
    note: optionalText().pipe(z.string().max(500, "หมายเหตุยาวเกิน 500 ตัวอักษร").nullable()),
  });
}

export const ORDER_FIELDS = [
  "customerName",
  "customerPhone",
  "total",
  "status",
  "orderedAt",
  "note",
] as const;

export type OrderFormData = z.output<ReturnType<typeof orderSchema>>;
export type OrderFormErrors = Partial<Record<(typeof ORDER_FIELDS)[number], string>>;
export type OrderFormResult =
  | { success: true; data: OrderFormData }
  | { success: false; errors: OrderFormErrors };

/**
 * ตรวจค่าจากฟอร์มออร์เดอร์ (เพิ่ม/แก้ไข) — คืนข้อมูลพร้อมบันทึก หรือข้อความผิดพลาดภาษาไทยแยกตามช่อง
 * `now` ส่งเข้ามาเพื่อเช็ค "ห้ามเป็นวันในอนาคต" (ทดสอบได้แน่นอน ไม่ขึ้นกับเวลาที่รัน)
 */
export function parseOrderForm(input: Record<string, unknown>, now: Date): OrderFormResult {
  const result = orderSchema(now).safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: firstErrorPerField(result.error) };
}

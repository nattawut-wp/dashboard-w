import { z } from "zod";
import { firstErrorPerField } from "@/lib/auth/validation";
import { moneyError, normalizeMoney } from "@/lib/money";
import { parseBangkokDateTimeInput } from "./datetime";
import { ORDER_STATUSES } from "./status";

// เบอร์มือถือ 10 หลัก (08x, 09x, 06x) หรือเบอร์บ้าน 9 หลัก (02x ...)
const THAI_PHONE = /^0\d{8,9}$/;

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
        const error = moneyError(value.replace(/,/g, ""), "ยอดรวม");
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

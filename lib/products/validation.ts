import { z } from "zod";
import { firstErrorPerField } from "@/lib/auth/validation";
import { moneyError, normalizeMoney } from "@/lib/money";

// A–Z 0–9 และ - ขึ้นต้นด้วยตัวอักษร/ตัวเลข ยาว 1–30
const SKU = /^[A-Z0-9][A-Z0-9-]{0,29}$/;

export const MAX_STOCK = 1_000_000;

/** จำนวนเต็มที่พิมพ์ในฟอร์ม ("1,200" → 1200) อยู่ในช่วง min–max — นอกนั้นแจ้ง `message` */
export function wholeNumber(message: string, min: number, max: number) {
  return z
    .string({ error: message })
    .transform((value) => value.trim().replace(/,/g, ""))
    .refine((value) => /^\d+$/.test(value), message)
    .transform(Number)
    .refine((value) => value >= min && value <= max, message);
}

const updateSchema = z.object({
  sku: z
    .string({ error: "กรุณากรอกรหัสสินค้า" })
    .trim()
    .toUpperCase()
    .min(1, "กรุณากรอกรหัสสินค้า")
    .regex(SKU, "รหัสสินค้าใช้ได้เฉพาะ A–Z, 0–9 และ - (ไม่เกิน 30 ตัว ไม่ขึ้นต้นด้วย -)"),
  name: z
    .string({ error: "กรุณากรอกชื่อสินค้า" })
    .trim()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(100, "ชื่อสินค้ายาวเกิน 100 ตัวอักษร"),
  price: z
    .string({ error: "กรุณากรอกราคา" })
    .trim()
    .min(1, "กรุณากรอกราคา")
    .superRefine((value, ctx) => {
      const error = moneyError(value.replace(/,/g, ""), "ราคา");
      if (error) ctx.addIssue({ code: "custom", message: error });
    })
    .transform(normalizeMoney),
  lowStockThreshold: wholeNumber("เกณฑ์แจ้งเตือนต้องเป็นจำนวนเต็ม 0–100,000", 0, 100_000),
});

// จำนวนคงเหลือกรอกได้ครั้งเดียวตอนเพิ่มสินค้า — หลังจากนั้นเปลี่ยนผ่าน "ปรับสต็อก" เท่านั้น
// (z.object ทิ้งช่องที่ไม่ได้ประกาศไว้ → ตอนแก้ไขส่ง stock มาก็ไม่ถูกใช้)
const createSchema = updateSchema.extend({
  stock: wholeNumber("จำนวนเริ่มต้นต้องเป็นจำนวนเต็ม 0–1,000,000", 0, MAX_STOCK),
});

export const PRODUCT_FIELDS = ["sku", "name", "price", "lowStockThreshold", "stock"] as const;

export type ProductCreateData = z.output<typeof createSchema>;
export type ProductUpdateData = z.output<typeof updateSchema>;
export type ProductFormErrors = Partial<Record<(typeof PRODUCT_FIELDS)[number], string>>;
export type ProductFormResult<T> = { success: true; data: T } | { success: false; errors: ProductFormErrors };

/** ตรวจค่าจากฟอร์มสินค้า — คืนข้อมูลพร้อมบันทึก หรือข้อความผิดพลาดภาษาไทยแยกตามช่อง */
export function parseProductForm(input: Record<string, unknown>, mode: "create"): ProductFormResult<ProductCreateData>;
export function parseProductForm(input: Record<string, unknown>, mode: "update"): ProductFormResult<ProductUpdateData>;
export function parseProductForm(
  input: Record<string, unknown>,
  mode: "create" | "update",
): ProductFormResult<ProductCreateData | ProductUpdateData> {
  const result = (mode === "create" ? createSchema : updateSchema).safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: firstErrorPerField(result.error) };
}

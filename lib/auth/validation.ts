import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// อีเมล: ตัดช่องว่าง + เป็นตัวเล็กเสมอ (Admin@Shop.com กับ admin@shop.com คือคนเดียวกัน)
export const emailSchema = z
  .string({ error: "กรุณากรอกอีเมล" })
  .trim()
  .toLowerCase()
  .min(1, "กรุณากรอกอีเมล")
  .pipe(z.email("รูปแบบอีเมลไม่ถูกต้อง"));

// รหัสผ่าน: ไม่ตัดช่องว่าง เพราะช่องว่างเป็นส่วนหนึ่งของรหัสได้
// จำกัดความยาวไว้กันคนส่งข้อความยาวมากมาถ่วงการเข้ารหัสฝั่งเซิร์ฟเวอร์
export const passwordSchema = z
  .string({ error: "กรุณากรอกรหัสผ่าน" })
  .min(1, "กรุณากรอกรหัสผ่าน")
  .max(PASSWORD_MAX_LENGTH, "รหัสผ่านยาวเกินไป");

const loginSchema = z.object({ email: emailSchema, password: passwordSchema });

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginErrors = Partial<Record<keyof LoginInput, string>>;

export type LoginParseResult =
  | { success: true; data: LoginInput }
  | { success: false; errors: LoginErrors };

/** ตรวจค่าจากฟอร์ม login — คืนข้อความผิดพลาดภาษาไทยแยกตามช่อง (ช่องละ 1 ข้อความ) */
export function parseLoginInput(input: { email: unknown; password: unknown }): LoginParseResult {
  const result = loginSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: firstErrorPerField(result.error) };
}

export function firstErrorPerField(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]);
    errors[field] ??= issue.message;
  }
  return errors;
}

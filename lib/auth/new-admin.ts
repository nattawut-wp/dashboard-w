import { z } from "zod";
import { emailSchema, firstErrorPerField, newPasswordSchema } from "./validation";

export const NAME_MAX_LENGTH = 50;

/** ช่องในฟอร์มเพิ่มผู้ดูแล */
export const NEW_ADMIN_FIELDS = ["name", "email", "password", "confirmPassword"] as const;
export type NewAdminField = (typeof NEW_ADMIN_FIELDS)[number];
export type NewAdminErrors = Partial<Record<NewAdminField, string>>;
export type NewAdminInput = { name: string; email: string; password: string };

const schema = z
  .object({
    // ไม่บังคับ — ว่างแล้วใช้ส่วนหน้า @ ของอีเมล (เหมือน npm run create-admin)
    name: z.string().trim().max(NAME_MAX_LENGTH, `ชื่อยาวได้ไม่เกิน ${NAME_MAX_LENGTH} ตัวอักษร`).nullish(),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string({ error: "กรุณายืนยันรหัสผ่าน" }).min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
  });

/** ตรวจฟอร์มหน้า "ผู้ดูแล" → ข้อมูลพร้อมสร้างบัญชี หรือข้อความผิดพลาดแยกตามช่อง */
export function parseNewAdminForm(
  input: Record<string, unknown>,
): { success: true; data: NewAdminInput } | { success: false; errors: NewAdminErrors } {
  const result = schema.safeParse(input);
  if (!result.success) return { success: false, errors: firstErrorPerField(result.error) };
  const { name, email, password } = result.data;
  return { success: true, data: { name: name || email.split("@")[0], email, password } };
}

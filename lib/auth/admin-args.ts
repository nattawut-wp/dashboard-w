import type { z } from "zod";
import { emailSchema, newPasswordSchema } from "./validation";

export const CREATE_ADMIN_USAGE = 'วิธีใช้: npm run create-admin -- <อีเมล> <รหัสผ่าน> ["ชื่อ"]';

export type AdminInput = { email: string; password: string; name: string };
export type AdminArgsResult =
  | { success: true; data: AdminInput }
  | { success: false; error: string };

/** อ่านค่าที่พิมพ์ต่อท้าย `npm run create-admin --` → อีเมล, รหัสผ่าน, ชื่อ (ไม่บังคับ) */
export function parseCreateAdminArgs(argv: string[]): AdminArgsResult {
  const [rawEmail, rawPassword, rawName] = argv;
  if (rawEmail === undefined || rawPassword === undefined || argv.length > 3) {
    return { success: false, error: CREATE_ADMIN_USAGE };
  }

  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) return { success: false, error: firstMessage(email.error) };

  const password = newPasswordSchema.safeParse(rawPassword);
  if (!password.success) return { success: false, error: firstMessage(password.error) };

  const name = rawName?.trim() || email.data.split("@")[0];
  return { success: true, data: { email: email.data, password: password.data, name } };
}

function firstMessage(error: z.ZodError): string {
  return error.issues[0].message;
}

"use server";

import { revalidatePath } from "next/cache";
import { createAdminAccount, deleteAdminAccount } from "@/lib/auth/admins";
import { NEW_ADMIN_FIELDS, parseNewAdminForm, type NewAdminErrors } from "@/lib/auth/new-admin";
import { getCurrentUser } from "@/lib/auth/session";

export type CreateAdminState = {
  success?: boolean;
  message?: string;
  errors?: NewAdminErrors;
  /** ชื่อ/อีเมลที่กรอก — ส่งกลับไปเติมฟอร์มเมื่อบันทึกไม่ผ่าน (ไม่ส่งรหัสผ่านกลับ) */
  values?: { name: string; email: string };
  /** เวลาที่สร้างสำเร็จ — ฟอร์มใช้ล้างช่องกรอก */
  savedAt?: number;
};

const CHECK_FORM = "กรุณาตรวจข้อมูลที่กรอกอีกครั้ง";

/** เพิ่มผู้ดูแล — ใช้กับ useActionState */
export async function createAdmin(_prev: CreateAdminState, formData: FormData): Promise<CreateAdminState> {
  await getCurrentUser(); // ไม่ได้ login → ถูกพาไปหน้า login (กันคนยิง action ตรงๆ)

  const input = Object.fromEntries(NEW_ADMIN_FIELDS.map((field) => [field, formData.get(field)]));
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const values = { name: text(input.name), email: text(input.email) };

  const parsed = parseNewAdminForm(input);
  if (!parsed.success) return { errors: parsed.errors, values, message: CHECK_FORM };

  const result = await createAdminAccount(parsed.data);
  if (!result.success) return { errors: { email: "อีเมลนี้มีบัญชีอยู่แล้ว" }, values, message: CHECK_FORM };

  revalidatePath("/users");
  return { success: true, message: `เพิ่ม ${parsed.data.name} แล้ว`, savedAt: Date.now() };
}

/** ลบผู้ดูแล (ลบตัวเอง/คนสุดท้ายไม่ได้) */
export async function deleteAdmin(userId: string): Promise<{ success: boolean; message?: string }> {
  const me = await getCurrentUser();
  const result = await deleteAdminAccount(userId, me.id);
  if (result.success) revalidatePath("/users");
  return result;
}

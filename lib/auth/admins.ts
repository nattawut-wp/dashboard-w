import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteAdminBlocker } from "./delete-admin";
import type { NewAdminInput } from "./new-admin";
import { auth } from "./server";

export type AdminRow = { id: string; name: string; email: string; createdAt: Date };

/** ผู้ดูแลทั้งหมด เรียงตามวันที่สร้าง (คนแรกอยู่บน) */
export function listAdmins(): Promise<AdminRow[]> {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
}

/**
 * สร้างบัญชีผู้ดูแล — ใช้ทั้งหน้า "ผู้ดูแล" และ `npm run create-admin`
 * ใช้ฟังก์ชันภายในของ Better Auth เพราะปิดการสมัครไว้ (sign-up ถูกบล็อกทุกทาง)
 * ทำแบบเดียวกับที่ Better Auth สมัครให้: สร้าง user + ผูกบัญชี "credential" ที่เก็บรหัสผ่านที่เข้ารหัสแล้ว
 */
export async function createAdminAccount({ email, password, name }: NewAdminInput): Promise<{ success: true } | { success: false; reason: "exists" }> {
  const ctx = await auth.$context;
  if (await ctx.internalAdapter.findUserByEmail(email)) return { success: false, reason: "exists" };

  const hash = await ctx.password.hash(password);
  try {
    const user = await ctx.internalAdapter.createUser({ email, name, emailVerified: true }, { method: "email-password" });
    await ctx.internalAdapter.linkAccount({ userId: user.id, providerId: "credential", accountId: user.id, password: hash });
  } catch (error) {
    // มีคนสร้างอีเมลเดียวกันพร้อมกันพอดี
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, reason: "exists" };
    }
    throw error;
  }
  return { success: true };
}

/**
 * ลบผู้ดูแล — session และรหัสผ่านถูกลบตาม (cascade) → คนนั้นหลุดจากระบบทันที
 * นับจำนวนและลบใน transaction แบบ Serializable กันสองคนลบกันพร้อมกันจนไม่เหลือใคร
 */
export async function deleteAdminAccount(targetId: string, currentUserId: string): Promise<{ success: boolean; message?: string }> {
  return prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!target) return { success: false, message: "ไม่พบบัญชีนี้ อาจถูกลบไปแล้ว" };
      const blocker = deleteAdminBlocker({ targetId, currentUserId, adminCount: await tx.user.count() });
      if (blocker) return { success: false, message: blocker };
      await tx.user.delete({ where: { id: targetId } });
      return { success: true };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

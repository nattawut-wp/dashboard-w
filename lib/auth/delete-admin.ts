type Input = {
  /** บัญชีที่จะลบ */
  targetId: string;
  /** คนที่กดลบ */
  currentUserId: string;
  /** จำนวนผู้ดูแลทั้งหมดตอนนี้ (รวมคนที่จะลบ) */
  adminCount: number;
};

/** เหตุผลที่ลบผู้ดูแลคนนี้ไม่ได้ — null = ลบได้ */
export function deleteAdminBlocker({ targetId, currentUserId, adminCount }: Input): string | null {
  if (targetId === currentUserId) return "ลบบัญชีของตัวเองไม่ได้";
  // กันระบบไม่มีใครเข้าได้เลย (เว็บไม่มีหน้าสมัคร)
  if (adminCount <= 1) return "ต้องมีผู้ดูแลเหลืออย่างน้อย 1 คน";
  return null;
}

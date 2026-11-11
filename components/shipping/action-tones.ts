/**
 * สีปุ่มหน้าจัดส่ง — ให้แยกออกด้วยตาว่าปุ่มไหนทำอะไร
 * success = ได้เงิน (เขียวทึบ), warning = ย้อนกลับ (ส้ม), danger = ตีกลับ (แดง)
 * trigger = ปุ่มบนการ์ด, confirm = ปุ่มยืนยันในกล่องถาม
 */
export const ACTION_TONES = {
  success: {
    trigger: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    confirm: "bg-emerald-600 text-white hover:bg-emerald-700",
  },
  warning: {
    trigger:
      "border border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-900/60",
    confirm: "bg-amber-600 text-white hover:bg-amber-700",
  },
  danger: {
    trigger:
      "border border-red-400 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-700 dark:bg-red-950/60 dark:text-red-200 dark:hover:bg-red-900/60",
    confirm: "bg-red-600 text-white hover:bg-red-700",
  },
} as const;

export type ActionTone = keyof typeof ACTION_TONES;

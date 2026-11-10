// id ของตารางเป็น int (SERIAL) ใน Postgres → สูงสุด 2,147,483,647
const MAX_INT = 2_147_483_647;

/** อ่าน id จาก URL (เช่น /orders/[id]/edit) — ค่าที่ใช้ไม่ได้คืน null (แสดงหน้า 404) */
export function parseId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return id <= MAX_INT ? id : null;
}

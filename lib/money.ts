// ตรวจและจัดรูปจำนวนเงินที่พิมพ์ในฟอร์ม — ใช้ร่วมกันทั้งยอดออร์เดอร์และราคาสินค้า
// ทำกับข้อความล้วน ไม่แปลงเป็น number เพื่อไม่ให้ทศนิยมเพี้ยน

// ตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง (ไม่รับ 1e5, .5, 12.)
const MONEY = /^\d+(\.\d{1,2})?$/;
const MAX_WHOLE_DIGITS = 10; // ตรงกับ Decimal(12, 2) ใน prisma/schema.prisma

/**
 * คืนข้อความผิดพลาด (ภาษาไทย) หรือ null ถ้าถูกต้อง — ต้องมากกว่า 0
 * `label` = ชื่อช่องที่ขึ้นต้นข้อความ เช่น "ยอดรวม", "ราคา"
 * `value` ต้องตัดคอมมาออกก่อนแล้ว
 */
export function moneyError(value: string, label: string): string | null {
  // ติดลบที่รูปแบบถูก → บอกว่าต้องมากกว่า 0 (ชัดกว่าบอกว่ารูปแบบผิด)
  if (value.startsWith("-") && MONEY.test(value.slice(1))) return `${label}ต้องมากกว่า 0`;
  if (!MONEY.test(value)) return `${label}ต้องเป็นตัวเลข ทศนิยมไม่เกิน 2 ตำแหน่ง`;
  if (/^[0.]+$/.test(value)) return `${label}ต้องมากกว่า 0`;
  // Decimal(12,2) = จำนวนเต็มได้ไม่เกิน 10 หลัก (ไม่นับ 0 นำหน้า)
  const wholeDigits = value.split(".")[0].replace(/^0+/, "");
  if (wholeDigits.length > MAX_WHOLE_DIGITS) return `${label}สูงเกินไป`;
  return null;
}

/** "1,250.5" → "1250.50" */
export function normalizeMoney(value: string): string {
  const [whole, fraction = ""] = value.replace(/,/g, "").split(".");
  return `${whole}.${fraction.padEnd(2, "0")}`;
}

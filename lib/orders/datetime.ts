// รูปแบบที่ช่อง <input type="datetime-local"> ส่งมา: YYYY-MM-DDTHH:mm (วินาทีมีหรือไม่มีก็ได้)
const DATETIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

// ประเทศไทยไม่มีการปรับเวลาฤดูร้อน → ห่าง UTC 7 ชั่วโมงตลอดปี
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Date → "YYYY-MM-DDTHH:mm" ตามเวลาไทย สำหรับใส่ค่าเริ่มต้นให้ช่อง datetime-local */
export function toBangkokDateTimeInput(date: Date): string {
  if (Number.isNaN(date.getTime())) return "";
  // เลื่อนเวลาไป +7 แล้วอ่านเป็น UTC = ได้ตัวเลขตามนาฬิกาไทย
  return new Date(date.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 16);
}

export function parseBangkokDateTimeInput(value: string | null | undefined): Date | null {
  const match = value ? DATETIME_LOCAL.exec(value) : null;
  if (!match) return null;
  const [year, month, day, hour, minute, second = 0] = match.slice(1).map((n) => Number(n ?? 0));

  // Date.UTC เลื่อนวันที่เกินให้เอง (30 ก.พ. → 2 มี.ค.) จึงต้องเช็คย้อนว่าค่ายังตรงกับที่กรอก
  const asUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const sameAsTyped =
    asUtc.getUTCFullYear() === year &&
    asUtc.getUTCMonth() === month - 1 &&
    asUtc.getUTCDate() === day &&
    asUtc.getUTCHours() === hour &&
    asUtc.getUTCMinutes() === minute &&
    asUtc.getUTCSeconds() === second;
  if (!sameAsTyped) return null;

  return new Date(asUtc.getTime() - BANGKOK_OFFSET_MS);
}

import { ShippingCarrier } from "@/generated/prisma/enums";

export type ShipmentData = { carrier: ShippingCarrier; trackingNumber: string };
export type ShipmentErrors = { carrier?: string; trackingNumber?: string };
export type ShipmentResult = { success: true; data: ShipmentData } | { success: false; errors: ShipmentErrors };

const CARRIERS = new Set<string>(Object.values(ShippingCarrier));
const TRACKING = /^[A-Z0-9]{6,30}$/;

function isCarrier(value: unknown): value is ShippingCarrier {
  return typeof value === "string" && CARRIERS.has(value);
}

/** ตัดช่องว่าง/ขีดออก + ตัวพิมพ์ใหญ่ ("th 1234-5678" → "TH12345678") */
function normalizeTracking(value: unknown): string {
  return typeof value === "string" ? value.replace(/[\s-]/g, "").toUpperCase() : "";
}

/** ตรวจฟอร์ม "บันทึกการจัดส่ง" (ขนส่ง + เลขพัสดุ) */
export function parseShipmentForm(input: { carrier: unknown; trackingNumber: unknown }): ShipmentResult {
  const trackingNumber = normalizeTracking(input.trackingNumber);
  const errors: ShipmentErrors = {};
  if (!isCarrier(input.carrier)) errors.carrier = "กรุณาเลือกขนส่ง";
  if (trackingNumber === "") errors.trackingNumber = "กรุณากรอกเลขพัสดุ";
  else if (!TRACKING.test(trackingNumber)) errors.trackingNumber = "เลขพัสดุต้องเป็น A–Z หรือ 0–9 ยาว 6–30 ตัว";

  if (!isCarrier(input.carrier) || errors.trackingNumber) return { success: false, errors };
  return { success: true, data: { carrier: input.carrier, trackingNumber } };
}

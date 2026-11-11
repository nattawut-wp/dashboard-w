import { ShippingCarrier } from "@/generated/prisma/enums";

/** ลำดับในตัวเลือก */
export const CARRIERS = [
  ShippingCarrier.KERRY,
  ShippingCarrier.FLASH,
  ShippingCarrier.JT,
  ShippingCarrier.THAILAND_POST,
  ShippingCarrier.OTHER,
] as const satisfies readonly ShippingCarrier[];

const LABELS = new Map<string, string>([
  [ShippingCarrier.KERRY, "Kerry Express"],
  [ShippingCarrier.FLASH, "Flash Express"],
  [ShippingCarrier.JT, "J&T Express"],
  [ShippingCarrier.THAILAND_POST, "ไปรษณีย์ไทย"],
  [ShippingCarrier.OTHER, "อื่นๆ"],
]);

export function carrierLabel(carrier: string | null): string {
  return (carrier && LABELS.get(carrier)) || "—";
}

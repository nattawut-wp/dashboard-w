"use client";

import { useState } from "react";
import { ChevronDown, MapPin, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  address: string | null;
  /** ไม่มีที่อยู่แต่ต้องส่งของ → แสดงป้ายเตือนแทน */
  warnMissing: boolean;
};

/** ที่อยู่จัดส่ง: ปกติย่อบรรทัดเดียว — คลิกเพื่อดูเต็ม / คลิกอีกครั้งเพื่อย่อ */
export function AddressLine({ address, warnMissing }: Props) {
  const [open, setOpen] = useState(false);
  const text = address?.trim();

  if (!text) {
    if (!warnMissing) return null;
    return (
      <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
        <TriangleAlert className="size-3.5" aria-hidden />
        ยังไม่มีที่อยู่จัดส่ง
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-label={open ? "ย่อที่อยู่จัดส่ง" : "ดูที่อยู่จัดส่งเต็ม"}
      className="mt-1 flex w-full max-w-full items-start gap-1 rounded-md text-left text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      {/* ย่อ: บรรทัดเดียวตัดด้วย … / เต็ม: แสดงทุกบรรทัดตามที่พิมพ์ */}
      <span className={cn("min-w-0 flex-1", open ? "whitespace-pre-line break-words" : "truncate")}>{text}</span>
      <ChevronDown className={cn("mt-0.5 size-3.5 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
    </button>
  );
}

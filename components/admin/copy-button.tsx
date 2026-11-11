"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  text: string;
  /** อธิบายว่าคัดลอกอะไร เช่น "ที่อยู่", "เลขพัสดุ" (ใช้ใน aria-label และข้อความแจ้ง) */
  label: string;
};

/** ปุ่มคัดลอกข้อความ (เช่น ที่อยู่ไปวางในแอปขนส่ง) */
export function CopyButton({ text, label }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`คัดลอก${label}แล้ว`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // เบราว์เซอร์บางตัวไม่อนุญาต (เช่น ไม่ใช่ https) — บอกให้คัดลอกเอง
      toast.error(`คัดลอก${label}ไม่ได้ กรุณาเลือกข้อความแล้วคัดลอกเอง`);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} aria-label={`คัดลอก${label}`}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      คัดลอก
    </Button>
  );
}

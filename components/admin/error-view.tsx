"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw, TriangleAlert } from "lucide-react";
import { StatusPage } from "@/components/admin/status-page";
import { Button } from "@/components/ui/button";

type Props = {
  error: unknown;
  /** ลองโหลดส่วนนี้ใหม่ (Next 16 ส่งมาเป็น `retry`) */
  retry: () => void;
  fullScreen?: boolean;
};

/**
 * หน้า "เกิดข้อผิดพลาด" — ไม่แสดงรายละเอียดทางเทคนิคให้ผู้ใช้เห็น
 * แสดงแค่รหัสอ้างอิง (digest) ไว้เทียบกับ log ฝั่งเซิร์ฟเวอร์ (Vercel → Logs)
 */
export function ErrorView({ error, retry, fullScreen }: Props) {
  useEffect(() => {
    console.error(error); // ดูได้ใน DevTools ของเบราว์เซอร์
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <StatusPage
      icon={TriangleAlert}
      title="เกิดข้อผิดพลาด"
      message="ระบบมีปัญหาชั่วคราว ข้อมูลที่บันทึกไว้แล้วไม่ได้หาย ลองใหม่อีกครั้ง"
      fullScreen={fullScreen}
    >
      <Button onClick={() => retry()}>
        <RotateCw className="size-4" />
        ลองใหม่
      </Button>
      <Button asChild variant="outline">
        <Link href="/dashboard">กลับหน้าภาพรวม</Link>
      </Button>
      {digest && <p className="w-full text-xs text-muted-foreground">รหัสอ้างอิง: {digest}</p>}
    </StatusPage>
  );
}

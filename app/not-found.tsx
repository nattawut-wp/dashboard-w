import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { StatusPage } from "@/components/admin/status-page";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "ไม่พบหน้านี้" };

// 404 ของทั้งเว็บ — URL ที่ไม่มีอยู่จริง (พิมพ์ผิด / ลิงก์เก่า)
export default function NotFound() {
  return (
    <StatusPage
      icon={SearchX}
      title="ไม่พบหน้านี้"
      message="ลิงก์อาจพิมพ์ผิด หรือหน้านี้ไม่มีอยู่แล้ว"
      fullScreen
    >
      <Button asChild>
        <Link href="/dashboard">กลับหน้าภาพรวม</Link>
      </Button>
    </StatusPage>
  );
}

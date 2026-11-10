"use client"; // Error boundary ต้องเป็น Client Component

import "./globals.css";

// ใช้เมื่อ layout หลักพังเอง (เกิดน้อยมาก) — แทนที่ทั้งหน้า จึงต้องมี <html>/<body> และโหลด CSS เอง
// ใช้ export metadata ไม่ได้ → ใช้ <title> ตรงๆ
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-foreground">
        <title>เกิดข้อผิดพลาด | แดชบอร์ดร้านค้า</title>
        <h1 className="text-xl font-semibold">เกิดข้อผิดพลาด</h1>
        <p className="max-w-sm text-muted-foreground">ระบบมีปัญหาชั่วคราว ข้อมูลที่บันทึกไว้แล้วไม่ได้หาย ลองใหม่อีกครั้ง</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            ลองใหม่
          </button>
          {/* ใช้ <a> ธรรมดา: โหลดใหม่ทั้งหน้า (ระบบนำทางของ Next อาจยังพังอยู่) */}
          <a href="/dashboard" className="rounded-lg border px-4 py-2 text-sm font-medium">
            กลับหน้าภาพรวม
          </a>
        </div>
      </body>
    </html>
  );
}

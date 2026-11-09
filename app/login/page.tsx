import type { Metadata } from "next";
import { Suspense } from "react";
import { Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Store className="size-6" />
          </div>
          <CardTitle className="text-xl">แดชบอร์ดร้านค้า</CardTitle>
          <CardDescription>สำหรับผู้ดูแลร้านเท่านั้น</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ฟอร์มอ่าน ?next= จาก URL จึงต้องอยู่ใน Suspense */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

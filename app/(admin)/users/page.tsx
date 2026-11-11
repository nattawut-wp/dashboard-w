import type { Metadata } from "next";
import { Suspense } from "react";
import { DeleteAdminButton } from "@/components/users/delete-admin-button";
import { NewAdminForm } from "@/components/users/new-admin-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listAdmins } from "@/lib/auth/admins";
import { getCurrentUser } from "@/lib/auth/session";
import { formatThaiDateTime } from "@/lib/orders/format";

export const metadata: Metadata = { title: "ผู้ดูแล" };

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">ผู้ดูแล</h1>
      {/* อ่าน session + ฐานข้อมูล → อยู่ใน Suspense ให้หัวหน้าแสดงได้ทันที */}
      <Suspense fallback={<UsersSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  );
}

async function UsersContent() {
  const me = await getCurrentUser();
  const admins = await listAdmins();
  const onlyOne = admins.length <= 1;

  return (
    <div className="space-y-4">
      <NewAdminForm />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ผู้ดูแลทั้งหมด {admins.length} คน</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <ul className="divide-y">
            {admins.map((admin) => {
              const isMe = admin.id === me.id;
              return (
                <li key={admin.id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      <span className="truncate">{admin.name}</span>
                      {isMe && <Badge variant="secondary">คุณ</Badge>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
                    <p className="text-xs text-muted-foreground">เพิ่มเมื่อ {formatThaiDateTime(admin.createdAt)}</p>
                  </div>
                  {/* ลบตัวเอง / คนสุดท้ายไม่ได้ — เซิร์ฟเวอร์เช็คซ้ำอีกชั้น */}
                  {!isMe && !onlyOne && <DeleteAdminButton userId={admin.id} name={admin.name} email={admin.email} />}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

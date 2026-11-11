"use client";

import { useActionState, useEffect } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/admin/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createAdmin } from "@/app/(admin)/users/actions";
import { NAME_MAX_LENGTH, type NewAdminField } from "@/lib/auth/new-admin";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";

export function NewAdminForm() {
  const [state, formAction, pending] = useActionState(createAdmin, {});

  useEffect(() => {
    if (state.success) toast.success(state.message ?? "เพิ่มผู้ดูแลแล้ว");
  }, [state]);

  const error = (field: NewAdminField) => state.errors?.[field];
  const fieldProps = (field: NewAdminField) => ({
    id: field,
    name: field,
    "aria-invalid": !!error(field),
    "aria-describedby": error(field) ? `${field}-error` : undefined,
    className: "h-11 text-base",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="size-4" />
          เพิ่มผู้ดูแล
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* สร้างสำเร็จ → key เปลี่ยน = ฟอร์มใหม่ช่องว่าง / ไม่ผ่าน → เติมชื่อ-อีเมลที่กรอกไว้ (รหัสผ่านต้องกรอกใหม่) */}
        <form key={state.savedAt} action={formAction} noValidate className="space-y-4">
          {state.message && state.errors && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="ชื่อที่แสดง" field="name" error={error("name")} hint="ไม่กรอก = ใช้ชื่อจากอีเมล">
              <Input {...fieldProps("name")} defaultValue={state.values?.name} autoComplete="off" maxLength={NAME_MAX_LENGTH} />
            </FormField>
            <FormField label="อีเมล (ใช้ login)" field="email" error={error("email")} required>
              <Input
                {...fieldProps("email")}
                defaultValue={state.values?.email}
                type="email"
                inputMode="email"
                autoComplete="off"
                autoCapitalize="none"
              />
            </FormField>
            <FormField
              label="รหัสผ่าน"
              field="password"
              error={error("password")}
              hint={`อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัว`}
              required
            >
              <Input {...fieldProps("password")} type="password" autoComplete="new-password" maxLength={PASSWORD_MAX_LENGTH} />
            </FormField>
            <FormField label="ยืนยันรหัสผ่าน" field="confirmPassword" error={error("confirmPassword")} required>
              <Input
                {...fieldProps("confirmPassword")}
                type="password"
                autoComplete="new-password"
                maxLength={PASSWORD_MAX_LENGTH}
              />
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground">
            ทุกคนในหน้านี้เข้าได้ทุกเมนูเท่ากัน — แจ้งอีเมลและรหัสผ่านให้เจ้าตัวเอง (ระบบไม่ส่งอีเมล)
          </p>
          <div className="flex justify-end">
            <Button type="submit" size="lg" className="h-11 w-full sm:w-auto" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {pending ? "กำลังเพิ่ม…" : "เพิ่มผู้ดูแล"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

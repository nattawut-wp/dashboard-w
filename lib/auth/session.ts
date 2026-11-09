import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./server";

export type CurrentUser = { id: string; name: string; email: string };

/**
 * ตรวจ session จริงกับฐานข้อมูล — ไม่มี/หมดอายุ → พาไปหน้า login
 * เรียกในทุกหน้าที่แสดงข้อมูล และทุก Server Action ที่แก้ข้อมูล
 * (proxy.ts เช็คแค่ว่ามี cookie ซึ่งปลอมได้ จึงใช้แทนการเช็คนี้ไม่ได้)
 *
 * อ่าน cookie ของ request → ต้องเรียกจาก component ที่อยู่ใน <Suspense>
 * `cache` ทำให้เรียกซ้ำใน request เดียวกันได้โดยไม่ query ซ้ำ
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const { id, name, email } = session.user;
  return { id, name, email };
});

import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// เช็คเร็วๆ ก่อนเข้าหน้า: ไม่มี cookie login → พาไปหน้า login แล้วจำหน้าที่จะไปไว้ใน ?next=
// เป็นแค่ด่านแรก (cookie ปลอมได้) — การเช็คจริงอยู่ที่ getCurrentUser() ใน lib/auth/session.ts
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/login" || getSessionCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // ทุกหน้า ยกเว้น API, ไฟล์ของ Next.js และไฟล์ที่มีนามสกุล (รูป, favicon ฯลฯ)
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};

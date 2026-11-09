import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth/server";

// ทางเข้าของ Better Auth ทั้งหมด: /api/auth/sign-in/email, /api/auth/sign-out, ...
// (การจำกัดจำนวนครั้งที่ลอง login ทำงานที่นี่)
export const { GET, POST } = toNextJsHandler(auth);

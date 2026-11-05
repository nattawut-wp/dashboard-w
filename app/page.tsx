import { redirect } from "next/navigation";

// หน้าแรกไม่มีเนื้อหา — พาไปหน้าภาพรวมเลย
export default function Home() {
  redirect("/dashboard");
}

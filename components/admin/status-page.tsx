import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  message: string;
  /** ปุ่ม/ลิงก์ด้านล่าง */
  children?: React.ReactNode;
  /** true = เต็มหน้าจอ (หน้าที่ไม่มีเมนู เช่น 404 ของทั้งเว็บ) */
  fullScreen?: boolean;
};

/** หน้าแจ้งสถานะ (ไม่พบหน้า / เกิดข้อผิดพลาด) — ใช้ร่วมกันทุกที่ */
export function StatusPage({ icon: Icon, title, message, children, fullScreen = false }: Props) {
  return (
    <main
      className={
        "flex flex-col items-center justify-center gap-4 px-4 text-center " +
        (fullScreen ? "min-h-screen bg-muted/40" : "py-16")
      }
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-7" aria-hidden />
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="max-w-sm text-muted-foreground">{message}</p>
      </div>
      {children && <div className="flex flex-wrap justify-center gap-2">{children}</div>}
    </main>
  );
}

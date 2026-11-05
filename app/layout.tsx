import type { Metadata, Viewport } from "next";
import { Geist_Mono, IBM_Plex_Sans_Thai } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// ฟอนต์หลักภาษาไทย (มีตัวอักษรอังกฤษในตัว) — ผูกกับตัวแปร --font-sans ที่ shadcn ใช้
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "แดชบอร์ดร้านค้า",
    template: "%s | แดชบอร์ดร้านค้า",
  },
  description: "ระบบดูยอดขายและจัดการออร์เดอร์สำหรับผู้ดูแลร้าน",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${plexThai.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}

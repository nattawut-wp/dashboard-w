import { LayoutDashboard, Package, ShoppingCart, Truck, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// เพิ่มเมนูใหม่ที่นี่ที่เดียว แล้วจะขึ้นทั้งบนคอมและมือถือ
export const navItems: NavItem[] = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/orders", label: "ออร์เดอร์", icon: ShoppingCart },
  { href: "/products", label: "คลังสินค้า", icon: Package },
  { href: "/shipping", label: "จัดส่ง", icon: Truck },
];

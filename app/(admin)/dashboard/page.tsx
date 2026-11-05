import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "ภาพรวม" };

// หน้านี้ยังเป็นโครงเปล่า — ขั้น 5 จะใส่ตัวเลขจริง กราฟ และออร์เดอร์ล่าสุด
const placeholders = ["ยอดขายวันนี้", "ยอดขายเดือนนี้", "จำนวนออร์เดอร์", "ยอดเฉลี่ยต่อออร์เดอร์"];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">ภาพรวม</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 md:gap-4">
        {placeholders.map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold md:text-2xl">—</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

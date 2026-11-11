import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SHOP_TIME_ZONE } from "@/lib/orders/format";
import { monthGrid, shiftMonth } from "@/lib/shipping/calendar";
import { buildShippingHref, type ShippingListParams } from "@/lib/shipping/list-params";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

const monthLabel = new Intl.DateTimeFormat("th-TH", { timeZone: SHOP_TIME_ZONE, month: "long", year: "numeric" });
const dayLabel = new Intl.DateTimeFormat("th-TH", { timeZone: SHOP_TIME_ZONE, dateStyle: "long" });

function noonOf(dateKey: string) {
  return new Date(`${dateKey}T12:00:00+07:00`);
}

type Props = {
  params: ShippingListParams;
  /** เดือนที่แสดง "YYYY-MM" */
  month: string;
  /** วันนี้ตามเวลาไทย "YYYY-MM-DD" */
  today: string;
  /** จำนวนออร์เดอร์ต่อวันในเดือนนี้ */
  counts: Record<string, number>;
  /** "วันที่สั่ง" หรือ "วันที่ส่ง" — บอกว่าตัวเลขนับจากอะไร */
  dateLabel: string;
};

/**
 * ปฏิทินบนหน้าจัดส่ง — ทุกช่องเป็นลิงก์ธรรมดา (ใช้ได้แม้ JavaScript ยังไม่โหลด)
 * กดวัน = กรองเฉพาะวันนั้น, กดวันเดิมซ้ำ = ดูทุกวัน
 */
export function ShippingCalendar({ params, month, today, counts, dateLabel }: Props) {
  // เปลี่ยนวัน/เดือนแล้วกลับไปหน้า 1 เสมอ
  const base = { ...params, page: 1 };
  const monthHref = (target: string) => buildShippingHref({ ...base, month: target });

  return (
    <Card className="w-full sm:max-w-md">
      <CardContent className="space-y-2 px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="เดือนก่อน">
            <Link href={monthHref(shiftMonth(month, -1))}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div className="text-center">
            <h2 className="font-semibold">{monthLabel.format(noonOf(`${month}-01`))}</h2>
            <p className="text-xs text-muted-foreground">ตัวเลข = จำนวนออร์เดอร์ตาม{dateLabel}</p>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label="เดือนถัดไป">
            <Link href={monthHref(shiftMonth(month, 1))}>
              <ChevronRight className="size-5" />
            </Link>
          </Button>
        </div>

        <table className="w-full table-fixed border-separate border-spacing-0.5 text-center">
          <thead>
            <tr>
              {WEEKDAYS.map((day) => (
                <th key={day} scope="col" className="py-1 text-xs font-medium text-muted-foreground">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(month).map((week, w) => (
              <tr key={w}>
                {week.map((dateKey, d) => (
                  <td key={dateKey ?? `empty-${w}-${d}`} className="p-0">
                    {dateKey && (
                      <DayCell
                        dateKey={dateKey}
                        count={counts[dateKey] ?? 0}
                        selected={dateKey === params.date}
                        isToday={dateKey === today}
                        // กดวันที่เลือกอยู่ซ้ำ = ยกเลิกการกรอง
                        href={buildShippingHref({ ...base, month, date: dateKey === params.date ? undefined : dateKey })}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {month !== today.slice(0, 7) && (
          <div className="flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link href={buildShippingHref({ ...base, month: undefined, date: undefined })}>ไปเดือนนี้</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DayCell({
  dateKey,
  count,
  selected,
  isToday,
  href,
}: {
  dateKey: string;
  count: number;
  selected: boolean;
  isToday: boolean;
  href: string;
}) {
  const day = Number(dateKey.slice(8));
  const label = `${dayLabel.format(noonOf(dateKey))} ${count > 0 ? `${count} ออร์เดอร์` : "ไม่มีออร์เดอร์"}`;
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={selected ? "date" : undefined}
      className={cn(
        "flex h-11 flex-col items-center justify-center rounded-md text-sm tabular-nums leading-none",
        selected
          ? "bg-primary text-primary-foreground"
          : count > 0
            ? "hover:bg-muted"
            : "text-muted-foreground hover:bg-muted",
        isToday && !selected && "ring-1 ring-primary ring-inset",
      )}
    >
      <span className={cn(isToday && "font-semibold")}>{day}</span>
      <span
        className={cn(
          "mt-1 h-3 text-[10px] font-medium",
          selected ? "text-primary-foreground" : "text-primary",
        )}
      >
        {count > 0 ? count : ""}
      </span>
    </Link>
  );
}

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SHOP_TIME_ZONE } from "@/lib/orders/format";
import { monthGrid, shiftMonth } from "@/lib/shipping/calendar";
import type { CalendarOrder } from "@/lib/shipping/data";
import { buildShippingHref, type ShippingListParams } from "@/lib/shipping/list-params";
import { cn } from "@/lib/utils";
import { CalendarMore } from "./calendar-more";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** ชื่อที่โชว์ในช่อง: มือถือ 2 ชื่อ, จอใหญ่ 3 ชื่อ — ที่เหลือเป็น "+N" */
const MOBILE_NAMES = 2;
const DESKTOP_NAMES = 3;

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
  /** ออร์เดอร์ของแต่ละวันในเดือนนี้ */
  days: Record<string, CalendarOrder[]>;
  /** "วันที่สั่ง" หรือ "วันที่ส่ง" — บอกว่าออร์เดอร์ถูกวางไว้วันไหน */
  dateLabel: string;
};

/**
 * ปฏิทินรายเดือนแบบ Google Calendar — ในช่องวันมีชื่อลูกค้า
 * ทุกช่องเป็นลิงก์ธรรมดา (ใช้ได้แม้ JavaScript ยังไม่โหลด): กดวัน = ดูเฉพาะวันนั้น, กดซ้ำ = ดูทุกวัน
 */
export function ShippingCalendar({ params, month, today, days, dateLabel }: Props) {
  // เปลี่ยนวัน/เดือนแล้วกลับไปหน้า 1 เสมอ
  const base = { ...params, page: 1 };
  const monthHref = (target: string) => buildShippingHref({ ...base, month: target });

  return (
    <Card className="w-full gap-2 py-3">
      <CardContent className="space-y-2 px-2 sm:px-4">
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="เดือนก่อน">
            <Link href={monthHref(shiftMonth(month, -1))}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="เดือนถัดไป">
            <Link href={monthHref(shiftMonth(month, 1))}>
              <ChevronRight className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold">{monthLabel.format(noonOf(`${month}-01`))}</h2>
            <p className="truncate text-xs text-muted-foreground">วางตาม{dateLabel} · กดวันเพื่อดูรายการ</p>
          </div>
          {month !== today.slice(0, 7) && (
            <Button asChild variant="outline" size="sm">
              <Link href={buildShippingHref({ ...base, month: undefined, date: undefined })}>วันนี้</Link>
            </Button>
          )}
        </div>

        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              {WEEKDAYS.map((day) => (
                <th key={day} scope="col" className="pb-1 text-xs font-medium text-muted-foreground">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthGrid(month).map((week, w) => (
              <tr key={w}>
                {week.map((dateKey, d) => (
                  <td key={dateKey ?? `empty-${w}-${d}`} className="border p-0 align-top">
                    {dateKey ? (
                      <DayCell
                        dateKey={dateKey}
                        orders={days[dateKey] ?? []}
                        selected={dateKey === params.date}
                        isToday={dateKey === today}
                        // กดวันที่เลือกอยู่ซ้ำ = ยกเลิกการกรอง
                        href={buildShippingHref({ ...base, month, date: dateKey === params.date ? undefined : dateKey })}
                        dayHref={buildShippingHref({ ...base, month, date: dateKey })}
                      />
                    ) : (
                      <div className="min-h-20 bg-muted/40 sm:min-h-24" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function DayCell({
  dateKey,
  orders,
  selected,
  isToday,
  href,
  dayHref,
}: {
  dateKey: string;
  orders: CalendarOrder[];
  selected: boolean;
  isToday: boolean;
  href: string;
  dayHref: string;
}) {
  const day = Number(dateKey.slice(8));
  const count = orders.length;
  const longDate = dayLabel.format(noonOf(dateKey));
  const label = `${longDate} ${count > 0 ? `${count} ออร์เดอร์` : "ไม่มีออร์เดอร์"}`;
  const mobileMore = count - MOBILE_NAMES;
  const desktopMore = count - DESKTOP_NAMES;

  return (
    // ลิงก์ของช่องวางทับทั้งช่อง (กดตรงไหนก็กรองวัน) ส่วนปุ่ม "+N" ลอยอยู่ด้านบนให้กดแยกได้
    <div
      className={cn(
        "relative flex min-h-20 flex-col gap-0.5 p-0.5 sm:min-h-24 sm:p-1",
        selected ? "bg-primary/10 ring-2 ring-primary ring-inset" : "hover:bg-muted/60",
      )}
    >
      <Link href={href} aria-label={label} aria-current={selected ? "date" : undefined} className="absolute inset-0" />
      <span
        className={cn(
          "pointer-events-none mx-auto flex size-6 items-center justify-center rounded-full text-xs tabular-nums sm:mx-0",
          isToday ? "bg-primary font-semibold text-primary-foreground" : count === 0 && "text-muted-foreground",
        )}
      >
        {day}
      </span>
      {orders.slice(0, DESKTOP_NAMES).map((order, i) => (
        <span
          key={order.id}
          className={cn(
            "pointer-events-none truncate rounded bg-emerald-100 px-1 text-[10px] leading-4 text-emerald-800 sm:text-xs sm:leading-5 dark:bg-emerald-900/50 dark:text-emerald-200",
            i >= MOBILE_NAMES && "hidden sm:block",
          )}
        >
          {order.customerName}
        </span>
      ))}
      {mobileMore > 0 && (
        <CalendarMore title={longDate} orders={orders} mobileMore={mobileMore} desktopMore={desktopMore} dayHref={dayHref} />
      )}
    </div>
  );
}

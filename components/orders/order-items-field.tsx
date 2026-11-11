"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductOption } from "@/lib/orders/types";

type Row = { key: number; productId: string; quantity: string };

type Props = {
  products: ProductOption[];
  /** รายการเดิม (หน้าแก้ไข) */
  defaultItems: { productId: number; quantity: number }[];
  /** จำนวนที่ออร์เดอร์นี้จองไว้อยู่แล้ว (หน้าแก้ไข) — นับรวมเป็น "ใช้ได้" ของออร์เดอร์นี้ */
  reserved: Record<number, number>;
  error?: string;
};

/**
 * แถวเลือกสินค้า + จำนวน (เพิ่ม/ลบแถวได้)
 * ส่งค่าไปเซิร์ฟเวอร์เป็น itemProductId / itemQuantity หลายค่า เรียงตามแถว
 * ตัวเลข "เหลือ" บนหน้าจอใช้เตือนเท่านั้น — เซิร์ฟเวอร์เช็คสต็อกจริงอีกครั้งตอนบันทึก
 */
export function OrderItemsField({ products, defaultItems, reserved, error }: Props) {
  const baseId = useId();
  const [rows, setRows] = useState<Row[]>(() =>
    defaultItems.length > 0
      ? defaultItems.map((item, i) => ({ key: i, productId: String(item.productId), quantity: String(item.quantity) }))
      : [{ key: 0, productId: "", quantity: "1" }],
  );
  const [nextKey, setNextKey] = useState(rows.length);

  const available = (product: ProductOption) => product.stock + (reserved[product.id] ?? 0);
  const byId = new Map(products.map((product) => [String(product.id), product]));

  function update(key: number, patch: Partial<Row>) {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((current) => [...current, { key: nextKey, productId: "", quantity: "1" }]);
    setNextKey((key) => key + 1);
  }
  function removeRow(key: number) {
    setRows((current) => (current.length > 1 ? current.filter((row) => row.key !== key) : current));
  }

  return (
    <fieldset className="min-w-0 space-y-3" aria-describedby={error ? `${baseId}-error` : undefined}>
      <legend className="text-sm font-medium">
        สินค้า<span className="text-destructive" aria-hidden> *</span>
        <span className="font-normal text-muted-foreground"> (ตัดสต็อกอัตโนมัติเมื่อบันทึก)</span>
      </legend>

      <ul className="space-y-2">
        {rows.map((row, index) => {
          const product = byId.get(row.productId);
          const quantity = Number(row.quantity);
          const short = product && Number.isInteger(quantity) && quantity > available(product);
          return (
            <li key={row.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`${baseId}-product-${row.key}`}>
                  สินค้าแถวที่ {index + 1}
                </label>
                <select
                  id={`${baseId}-product-${row.key}`}
                  name="itemProductId"
                  value={row.productId}
                  onChange={(event) => update(row.key, { productId: event.target.value })}
                  aria-invalid={!!error}
                  className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-base aria-invalid:border-destructive"
                >
                  <option value="">— เลือกสินค้า —</option>
                  {products.map((option) => {
                    const left = available(option);
                    return (
                      <option
                        key={option.id}
                        value={option.id}
                        // หมดแล้วเลือกใหม่ไม่ได้ (แต่แถวที่เลือกไว้แล้วยังแสดงอยู่)
                        disabled={left <= 0 && String(option.id) !== row.productId}
                      >
                        {option.name} — {left > 0 ? `เหลือ ${left.toLocaleString("th-TH")}` : "หมด"}
                        {!option.isActive && " (เลิกขาย)"}
                      </option>
                    );
                  })}
                </select>
                <label className="sr-only" htmlFor={`${baseId}-quantity-${row.key}`}>
                  จำนวนแถวที่ {index + 1}
                </label>
                <Input
                  id={`${baseId}-quantity-${row.key}`}
                  name="itemQuantity"
                  inputMode="numeric"
                  value={row.quantity}
                  onChange={(event) => update(row.key, { quantity: event.target.value })}
                  className={cn("h-11 w-16 shrink-0 text-center text-base tabular-nums sm:w-20", short && "border-amber-500")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  className="shrink-0"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length === 1}
                  aria-label={`ลบแถวที่ ${index + 1}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
              {short && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  เหลือแค่ {available(product).toLocaleString("th-TH")} ชิ้น — บันทึกไม่ได้ถ้าของไม่พอ
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <Button type="button" variant="outline" onClick={addRow}>
        <Plus className="size-4" />
        เพิ่มสินค้า
      </Button>

      {error && (
        <p id={`${baseId}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

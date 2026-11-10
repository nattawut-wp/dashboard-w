import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  /** id ของช่องกรอก (ใช้ผูก label และข้อความผิดพลาด) */
  field: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
};

/**
 * ป้ายชื่อ + ช่องกรอก + ข้อความผิดพลาด ใต้ช่อง
 * ช่องกรอกข้างในต้องใส่ id={field} และ aria-describedby={`${field}-error`} เมื่อมี error
 */
export function FormField({ label, field, error, hint, required, children }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field}>
        {label}
        {required && <span className="text-destructive" aria-hidden> *</span>}
        {hint && <span className="font-normal text-muted-foreground"> ({hint})</span>}
      </Label>
      {children}
      {error && (
        <p id={`${field}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

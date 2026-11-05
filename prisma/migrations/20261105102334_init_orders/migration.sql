-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'CANCELLED');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "orderedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_orderedAt_idx" ON "orders"("orderedAt");

-- CreateIndex
CREATE INDEX "orders_status_orderedAt_idx" ON "orders"("status", "orderedAt");

-- ปิดการเข้าถึงผ่าน API อัตโนมัติของ Supabase (anon / authenticated key)
-- เปิด RLS โดยไม่มี policy = ไม่มีใครอ่าน/เขียนผ่าน API ได้
-- แอปเราต่อผ่าน Prisma ด้วย user เจ้าของตาราง จึงไม่โดน RLS
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;

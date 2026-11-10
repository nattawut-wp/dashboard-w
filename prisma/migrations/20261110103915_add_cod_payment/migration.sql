-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'COD');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "codCollectedAt" TIMESTAMPTZ(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'TRANSFER';

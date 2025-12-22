-- AlterTable
ALTER TABLE "payment_orders" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "processed_at" TIMESTAMP(3),
ADD COLUMN     "reserved_at" TIMESTAMP(3),
ADD COLUMN     "reserved_until" TIMESTAMP(3),
ALTER COLUMN "total_amount" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "payment_orders_reserved_until_idx" ON "payment_orders"("reserved_until");

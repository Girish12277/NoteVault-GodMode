/*
  Warnings:

  - A unique constraint covering the columns `[invoice_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "invoice_generated_at" TIMESTAMP(3),
ADD COLUMN     "invoice_hash" TEXT,
ADD COLUMN     "invoice_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_invoice_id_key" ON "transactions"("invoice_id");

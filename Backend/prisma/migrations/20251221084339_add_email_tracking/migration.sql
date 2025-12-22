/*
  Warnings:

  - You are about to drop the column `discount_type` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `discount_value` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `min_purchase_amount` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `usage_limit` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `valid_from` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `valid_until` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `coupon_code` on the `payment_orders` table. All the data in the column will be lost.
  - You are about to drop the column `coupon_discount` on the `payment_orders` table. All the data in the column will be lost.
  - Added the required column `type` to the `coupons` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `coupons` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('GLOBAL', 'CATEGORY', 'SELLER', 'NOTE');

-- AlterTable
ALTER TABLE "coupons" DROP COLUMN "discount_type",
DROP COLUMN "discount_value",
DROP COLUMN "min_purchase_amount",
DROP COLUMN "usage_limit",
DROP COLUMN "valid_from",
DROP COLUMN "valid_until",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "min_order_value" DECIMAL(10,2),
ADD COLUMN     "scope" "CouponScope" NOT NULL DEFAULT 'GLOBAL',
ADD COLUMN     "scope_ids" TEXT[],
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "type" "CouponType" NOT NULL,
ADD COLUMN     "usage_limit_global" INTEGER,
ADD COLUMN     "usage_limit_per_user" INTEGER,
ADD COLUMN     "value" DECIMAL(10,2) NOT NULL;

-- AlterTable
ALTER TABLE "payment_orders" DROP COLUMN "coupon_code",
DROP COLUMN "coupon_discount";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "coupon_id" TEXT;

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "discount_amount" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages"("user_id");

-- CreateIndex
CREATE INDEX "coupon_usages_transaction_id_idx" ON "coupon_usages"("transaction_id");

-- CreateIndex
CREATE INDEX "coupons_is_active_idx" ON "coupons"("is_active");

-- CreateIndex
CREATE INDEX "coupons_start_date_end_date_idx" ON "coupons"("start_date", "end_date");

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

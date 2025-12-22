-- CreateTable
CREATE TABLE "alert_failures" (
    "id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "attempts" TEXT NOT NULL,
    "attempt_count" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "last_attempt_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_failures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "note_ids" TEXT[],
    "total_amount" DECIMAL(65,30) NOT NULL,
    "razorpay_order_id" TEXT,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_reconciliation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "our_total" DECIMAL(65,30) NOT NULL,
    "our_count" INTEGER NOT NULL,
    "razorpay_total" DECIMAL(65,30) NOT NULL,
    "razorpay_count" INTEGER NOT NULL,
    "amount_difference" DECIMAL(65,30) NOT NULL,
    "count_difference" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alert_failures_status_idx" ON "alert_failures"("status");

-- CreateIndex
CREATE INDEX "alert_failures_severity_idx" ON "alert_failures"("severity");

-- CreateIndex
CREATE INDEX "alert_failures_created_at_idx" ON "alert_failures"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_idempotency_key_key" ON "payment_orders"("idempotency_key");

-- CreateIndex
CREATE INDEX "payment_orders_user_id_idx" ON "payment_orders"("user_id");

-- CreateIndex
CREATE INDEX "payment_orders_razorpay_order_id_idx" ON "payment_orders"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "payment_orders_created_at_idx" ON "payment_orders"("created_at");

-- CreateIndex
CREATE INDEX "payment_orders_status_idx" ON "payment_orders"("status");

-- CreateIndex
CREATE INDEX "financial_reconciliation_status_idx" ON "financial_reconciliation"("status");

-- CreateIndex
CREATE INDEX "financial_reconciliation_created_at_idx" ON "financial_reconciliation"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "financial_reconciliation_date_key" ON "financial_reconciliation"("date");

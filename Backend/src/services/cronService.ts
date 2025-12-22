import cron from 'node-cron';
import { prisma } from '../config/database';
import { notificationService } from './notificationService';
import { financialReconciliationService } from './financialReconciliationService';
import { PaymentIdempotencyService } from './paymentIdempotencyService';
import { DatabaseBackupService } from './databaseBackupService';
import { retryFailedUploads } from './cloudinaryCircuitBreaker';

const prismaAny = prisma as any;

/**
 * Cron Service
 * Handles scheduled tasks
 */
export class CronService {
    private static jobs: any[] = [];

    /**
     * Initialize all cron jobs
     */
    public static init() {
        console.log('⏰ Cron service initialized');

        // Job 1: Release Escrow Funds
        // Runs every hour at minute 0
        const escrowJob = cron.schedule('0 * * * *', async () => {
            console.log('running escrow release job');
            await this.releaseEscrow();
        });

        // Job 2: Process Broadcast Notifications
        // Runs every 5 minutes
        const broadcastJob = cron.schedule('*/5 * * * *', async () => {
            try {
                const result = await notificationService.processPendingBroadcasts();
                if (result.processed > 0 || result.errors.length > 0) {
                    console.log(`🔔 Broadcast processing: ${result.processed} sent, ${result.errors.length} errors`);
                }
            } catch (err) {
                console.error('❌ Broadcast processing error:', err);
            }
        });

        // Job 3: Cleanup Expired Payment Reservations (GOD-LEVEL FIX #1)
        // Runs every hour at minute 30
        const paymentCleanupJob = cron.schedule('30 * * * *', async () => {
            console.log('[CRON] Running expired payment reservations cleanup');
            const count = await PaymentIdempotencyService.cleanupExpiredReservations();
            console.log(`[CRON] Cleaned up ${count} expired reservations`);
        });

        // Job 4: Retry Failed Cloudinary Uploads (GOD-LEVEL FIX #3)
        // Runs every hour at minute 45
        const cloudinaryRetryJob = cron.schedule('45 * * * *', async () => {
            try {
                console.log('[CRON] Retrying failed Cloudinary uploads...');
                const count = await retryFailedUploads();
                if (count > 0) {
                    console.log(`✅ Successfully retried ${count} uploads`);
                }
            } catch (error) {
                console.error('❌ Cloudinary retry job failed:', error);
            }
        });

        // Job 5: Financial Reconciliation (God-Level Enhancement #18)
        // Runs daily at 2 AM IST
        const reconciliationJob = cron.schedule('0 2 * * *', async () => {
            try {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                console.log('Running daily financial reconciliation...');
                const result = await financialReconciliationService.reconcileDaily(yesterday);

                if (result.status === 'MATCH') {
                    console.log(`✅ Financial reconciliation passed: ₹${result.ourTotal}`);
                } else {
                    console.error(`❌ Financial reconciliation MISMATCH: ₹${result.difference}`);
                }
            } catch (error) {
                console.error('❌ Financial reconciliation job failed:', error);
            }
        });

        // Job 6: Daily Database Backup (GOD-LEVEL FIX #2)
        // Runs daily at 3 AM IST (after financial reconciliation)
        const backupJob = cron.schedule('0 3 * * *', async () => {
            try {
                console.log('[CRON] Starting daily database backup...');
                const result = await DatabaseBackupService.createFullBackup();

                if (result.success) {
                    console.log(`✅ Database backup successful: ${result.backupFile} (${Math.round(result.sizeBytes / 1024 / 1024)}MB)`);
                } else {
                    console.error(`❌ Database backup FAILED: ${result.error}`);
                }
            } catch (error) {
                console.error('❌ Database backup job failed:', error);
            }
        });

        // Store jobs for cleanup
        this.jobs.push(escrowJob, broadcastJob, paymentCleanupJob, cloudinaryRetryJob, reconciliationJob, backupJob);

        console.log('✅ Cron jobs started');

        // Also run once on startup for development verification (optional)
        if (process.env.NODE_ENV === 'development') {
            // this.releaseEscrow().catch(console.error);
        }
    }

    /**
     * Stop all cron jobs (Enhancement #8: Graceful Shutdown)
     */
    public static stop(): void {
        this.jobs.forEach(job => job.stop());
        this.jobs = [];
    }

    /**
     * Release funds from escrow to available balance
     * Logic: Find transactions where 24h passed, mark released, move funds.
     */
    private static async releaseEscrow() {
        try {
            const now = new Date();
            const batchSize = 50; // Process in small batches

            // Find eligible transactions (snake_case)
            const transactions = await prismaAny.transactions.findMany({
                where: {
                    status: 'SUCCESS',
                    is_released_to_seller: false,
                    escrow_release_at: { lte: now }
                },
                take: batchSize
            });

            if (transactions.length === 0) {
                return;
            }

            console.log(`💰 Processing escrow release for ${transactions.length} transactions`);

            let successCount = 0;

            for (const tx of transactions) {
                try {
                    await prisma.$transaction(async (txPrisma) => {
                        const txAny = txPrisma as any;
                        // 1. Mark transaction as released
                        // Verify it's still unreleased inside transaction lock logic (implicitly via update count or explicit check)
                        const updatedTx = await txAny.transactions.updateMany({
                            where: {
                                id: tx.id,
                                is_released_to_seller: false // Double check
                            },
                            data: { is_released_to_seller: true }
                        });

                        if (updatedTx.count === 0) {
                            throw new Error('Transaction already released or not found');
                        }

                        // 2. Move funds in SellerWallet (snake_case)
                        await txAny.seller_wallets.update({
                            where: { seller_id: tx.seller_id },
                            data: {
                                pending_balance_inr: { decrement: tx.seller_earning_inr },
                                available_balance_inr: { increment: tx.seller_earning_inr }
                            }
                        });
                    });

                    successCount++;
                } catch (err) {
                    console.error(`❌ Failed to release transaction ${tx.id}:`, err);
                }
            }

            if (successCount > 0) {
                console.log(`✨ Successfully released funds for ${successCount} transactions`);
            }

        } catch (error) {
            console.error('🔥 Escrow release job failed:', error);
        }
    }
}

import cron from 'node-cron';
import { prisma } from '../config/database';
import { notificationService } from './notificationService';

const prismaAny = prisma as any;

/**
 * Cron Service
 * Handles scheduled tasks
 */
export class CronService {
    /**
     * Initialize all cron jobs
     */
    public static init() {
        console.log('⏰ Cron service initialized');

        // Job 1: Release Escrow Funds
        // Runs every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            console.log('running escrow release job');
            await this.releaseEscrow();
        });

        // Job 2: Process Notification Broadcasts
        // Runs every minute to process pending broadcasts
        cron.schedule('* * * * *', async () => {
            try {
                const result = await notificationService.processPendingBroadcasts();
                if (result.processed > 0 || result.errors.length > 0) {
                    console.log(`🔔 Broadcast processing: ${result.processed} sent, ${result.errors.length} errors`);
                    if (result.errors.length > 0) {
                        console.error('Broadcast errors:', result.errors);
                    }
                }
            } catch (err) {
                console.error('❌ Broadcast processing error:', err);
            }
        });

        // Also run once on startup for development verification (optional)
        if (process.env.NODE_ENV === 'development') {
            // this.releaseEscrow().catch(console.error);
        }
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

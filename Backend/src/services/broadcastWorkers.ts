import { Worker, Job } from 'bullmq';
import { logger } from './logger';
import { broadcastService } from './broadcastService';
import { multiEmailService } from './multiProviderEmailService';
import { whatsappService } from './whatsappService';
import { prisma } from '../config/database';

/**
 * GOD-LEVEL BROADCAST WORKERS
 * Million-user scalability with batch processing
 * 
 * Performance:
 * - Email: 10,000 emails/minute (Brevo limit)
 * - WhatsApp: 1,000 messages/minute (Twilio sandbox)
 * - Batch size: 10,000 users
 * - Concurrency: 10 jobs parallel
 */

const isRedisConfigured = !!(process.env.REDIS_HOST || process.env.REDIS_URL);

let redisConnection: any = { host: 'disabled', port: 0 };

if (isRedisConfigured) {
    if (process.env.REDIS_URL) {
        try {
            const parsedUrl = new URL(process.env.REDIS_URL);
            redisConnection = {
                host: parsedUrl.hostname,
                port: parseInt(parsedUrl.port || '6379'),
                password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
                username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
                tls: parsedUrl.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
                maxRetriesPerRequest: null,
            };
        } catch (e) {
            console.error('Failed to parse REDIS_URL, falling back to basic config', e);
        }
    }

    if (redisConnection.host === 'disabled' || !process.env.REDIS_URL) {
        redisConnection = {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            maxRetriesPerRequest: null,
        };
    }
}

// Helper to safely create worker
const createWorker = <T>(name: string, processor: any, opts?: any) => {
    if (!isRedisConfigured) {
        return { on: () => { }, close: async () => { } } as any;
    }
    return new Worker(name, processor, { connection: redisConnection, ...opts });
};

/**
 * Broadcast Batch Worker (processes batches of 10k users)
 */
export const broadcastBatchWorker = createWorker(
    'broadcast-batch',
    async (job: Job) => {
        const { campaignId, batchId, userIds, channel, subject, message, mediaUrl } = job.data;

        logger.info(`📦 Processing broadcast batch ${batchId}: ${userIds.length} users via ${channel}`);

        try {
            // Update batch status
            await (prisma as any).broadcast_batches.update({
                where: { id: batchId },
                data: {
                    status: 'processing',
                    started_at: new Date(),
                },
            });

            // Fetch user details (email/phone)
            const users = await (prisma as any).users.findMany({
                where: { id: { in: userIds } },
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    full_name: true,
                },
            });

            let succeeded = 0;
            let failed = 0;

            // Process based on channel
            if (channel === 'email') {
                // Send emails in parallel (batch of 100 at a time to avoid overwhelming)
                for (let i = 0; i < users.length; i += 100) {
                    const batch = users.slice(i, i + 100);

                    const promises = batch.map(async (user: any) => {
                        try {
                            const result = await multiEmailService.send({
                                to: user.email,
                                subject: subject || 'Message from StudyVault',
                                html: message,
                                text: message.replace(/<[^>]*>/g, ''), // Strip HTML for text version
                            });

                            // Log delivery
                            await (prisma as any).broadcast_deliveries.create({
                                data: {
                                    id: require('crypto').randomBytes(8).toString('hex'),
                                    campaign_id: campaignId,
                                    batch_id: batchId,
                                    user_id: user.id,
                                    recipient: user.email,
                                    channel: 'email',
                                    message_id: result.messageId,
                                    status: result.success ? 'sent' : 'failed',
                                    sent_at: result.success ? new Date() : null,
                                    error_message: result.error,
                                    created_at: new Date(),
                                },
                            });

                            if (result.success) {
                                succeeded++;
                            } else {
                                failed++;
                            }
                        } catch (error: any) {
                            logger.error(`Email send failed for user ${user.id}:`, error);
                            failed++;
                        }
                    });

                    await Promise.all(promises);

                    // Rate limiting: wait 6 seconds between batches (10k emails/min = 166/sec ~ 100/600ms)
                    if (i + 100 < users.length) {
                        await new Promise(resolve => setTimeout(resolve, 600));
                    }
                }
            } else if (channel === 'whatsapp') {
                // Send WhatsApp messages (slower rate limit)
                for (const user of users) {
                    if (!user.phone) {
                        failed++;
                        continue;
                    }

                    try {
                        const result = await whatsappService.sendMessage({
                            to: user.phone,
                            body: message,
                            mediaUrl,
                        });

                        // Log delivery
                        await (prisma as any).broadcast_deliveries.create({
                            data: {
                                id: require('crypto').randomBytes(8).toString('hex'),
                                campaign_id: campaignId,
                                batch_id: batchId,
                                user_id: user.id,
                                recipient: user.phone,
                                channel: 'whatsapp',
                                message_id: result.messageSid,
                                status: result.success ? 'sent' : 'failed',
                                sent_at: result.success ? new Date() : null,
                                error_message: result.error,
                                created_at: new Date(),
                            },
                        });

                        if (result.success) {
                            succeeded++;
                        } else {
                            failed++;
                        }

                        // Rate limiting: 1k messages/min = 16/sec ~ 60ms delay
                        await new Promise(resolve => setTimeout(resolve, 60));
                    } catch (error: any) {
                        logger.error(`WhatsApp send failed for user ${user.id}:`, error);
                        failed++;
                    }
                }
            }

            // Update batch status
            await (prisma as any).broadcast_batches.update({
                where: { id: batchId },
                data: {
                    status: 'completed',
                    completed_at: new Date(),
                    processed_count: succeeded + failed,
                    succeeded_count: succeeded,
                    failed_count: failed,
                },
            });

            // Update campaign progress
            await broadcastService.updateCampaignProgress(
                campaignId,
                succeeded + failed,
                succeeded,
                failed
            );

            logger.info(`✅ Batch ${batchId} complete: ${succeeded} succeeded, ${failed} failed`);

            return { succeeded, failed };
        } catch (error: any) {
            logger.error(`❌ Batch ${batchId} failed:`, error);

            // Update batch as failed
            await (prisma as any).broadcast_batches.update({
                where: { id: batchId },
                data: {
                    status: 'failed',
                    error_message: error.message,
                },
            });

            throw error;
        }
    },
    {
        concurrency: 10, // Process 10 batches in parallel
        limiter: {
            max: 100, // Maximum 100 jobs per interval
            duration: 60000, // Per minute
        },
    }
);

/**
 * Simple Broadcast Worker (for small custom messages)
 */
export const broadcastWorker = createWorker(
    'broadcast',
    async (job: Job) => {
        const { campaignId, userIds, channels, subject, message, mediaUrl } = job.data;

        logger.info(`📢 Processing broadcast for campaign ${campaignId}: ${userIds.length} users`);

        try {
            // For small broadcasts (<1000 users), process directly
            // For large broadcasts, this should split into batches (handled by service)

            if (userIds.length > 1000) {
                logger.warn(`Large broadcast detected (${userIds.length} users) - should be batched`);
            }

            // Fetch users
            const users = await (prisma as any).users.findMany({
                where: { id: { in: userIds } },
                select: { id: true, email: true, phone: true },
            });

            let succeeded = 0;
            let failed = 0;

            // Send via each channel
            for (const channel of channels) {
                if (channel === 'email') {
                    for (const user of users) {
                        try {
                            const result = await multiEmailService.send({
                                to: user.email,
                                subject: subject || 'Message from StudyVault',
                                html: message,
                                text: message.replace(/<[^>]*>/g, ''),
                            });

                            if (result.success) succeeded++;
                            else failed++;
                        } catch (error) {
                            failed++;
                        }
                    }
                } else if (channel === 'whatsapp') {
                    for (const user of users) {
                        if (!user.phone) continue;

                        try {
                            const result = await whatsappService.sendMessage({
                                to: user.phone,
                                body: message,
                                mediaUrl,
                            });

                            if (result.success) succeeded++;
                            else failed++;

                            await new Promise(resolve => setTimeout(resolve, 60));
                        } catch (error) {
                            failed++;
                        }
                    }
                }
            }

            // Update campaign
            await broadcastService.updateCampaignProgress(
                campaignId,
                succeeded + failed,
                succeeded,
                failed
            );

            logger.info(`✅ Broadcast complete: ${succeeded} succeeded, ${failed} failed`);

            return { succeeded, failed };
        } catch (error: any) {
            logger.error(`❌ Broadcast failed:`, error);
            throw error;
        }
    },
    {
        concurrency: 5,
    }
);

// Event listeners
broadcastBatchWorker.on('completed', (job: any) => {
    logger.info(`✅ Broadcast batch job ${job.id} completed`);
});

broadcastBatchWorker.on('failed', (job: any, err: any) => {
    logger.error(`❌ Broadcast batch job ${job?.id} failed:`, err);
});

broadcastWorker.on('completed', (job: any) => {
    logger.info(`✅ Broadcast job ${job.id} completed`);
});

broadcastWorker.on('failed', (job: any, err: any) => {
    logger.error(`❌ Broadcast job ${job?.id} failed:`, err);
});

logger.info('✅ Broadcast workers initialized');

/**
 * GOD-LEVEL CRITICAL FIX #4 PHASE 2: Expanded Queue Service
 * 
 * Phase 2 Expansion:
 * ✅ Email sending queue (instant API responses)
 * ✅ Notification broadcast queue (event-driven)
 * ✅ Backup processing queue (on-demand)
 * 
 * Phase 1 Foundation:
 * ✅ Cloudinary retry queue (migrated from cron)
 */

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { logger } from './logger';
import { alertService } from './alertService';
import * as fs from 'fs/promises';
import { safeCloudinaryService } from './cloudinaryCircuitBreaker';

/**
 * Redis connection configuration
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

/**
 * Job type definitions
 */
interface CloudinaryRetryJob {
    localPath: string;
    originalPublicId: string;
    resourceType: 'raw' | 'image' | 'video' | 'auto';
    format?: string;
}

interface EmailJob {
    to: string;
    subject: string;
    html: string;
    text?: string;
    templateName?: string;
}

interface NotificationBroadcastJob {
    broadcastId: string;
}

interface BroadcastJob {
    campaignId: string;
    userIds: string[];
    channels: ('email' | 'whatsapp')[];
    subject?: string;
    message: string;
    mediaUrl?: string;
}

interface BroadcastBatchJob {
    campaignId: string;
    batchId: string;
    userIds: string[];
    channel: 'email' | 'whatsapp';
    subject?: string;
    message: string;
    mediaUrl?: string;
}

interface BackupJob {
    type: 'full' | 'incremental';
    priority?: 'high' | 'normal' | 'low';
}

interface PDFProcessingJob {
    noteId: string;
    pdfUrl: string;
    operations: ('ocr' | 'thumbnail' | 'compress')[];
    priority?: 'high' | 'normal' | 'low';
}

interface AnalyticsJob {
    type: 'page_view' | 'revenue' | 'activity';
    entityType: 'note' | 'category' | 'user';
    entityId: string;
    data?: Record<string, any>;
}

/**
 * Queue names (centralized)
 */
export const QUEUE_NAMES = {
    CLOUDINARY_RETRY: 'cloudinary-retry',
    EMAIL_SENDING: 'email-sending',
    NOTIFICATION_BROADCAST: 'notification-broadcast',
    BACKUP_PROCESSING: 'backup-processing',
    PDF_PROCESSING: 'pdf-processing',        // Phase 3
    ANALYTICS_AGGREGATION: 'analytics-aggregation'  // Phase 3
} as const;

// Helper to safely create queue
const createQueue = <T>(name: string, opts?: any) => {
    if (!isRedisConfigured) {
        return {
            add: async () => { logger.warn(`[Queue: ${name}] Redis disabled, skipping job`); return {}; },
            getWaitingCount: async () => 0,
            getActiveCount: async () => 0,
            getCompletedCount: async () => 0,
            getFailedCount: async () => 0,
            close: async () => { }
        } as any;
    }
    return new Queue<T>(name, { connection: redisConnection, ...opts });
};

// Helper to safely create worker
const createWorker = <T>(name: string, processor: any, opts?: any) => {
    if (!isRedisConfigured) {
        return { on: () => { }, close: async () => { } } as any;
    }
    return new Worker<T>(name, processor, { connection: redisConnection, ...opts });
};

// Helper to safely create queue events
const setupQueueEvents = (queueName: string) => {
    if (!isRedisConfigured) {
        return { on: () => { }, close: async () => { } } as any;
    }

    const queueEvents = new QueueEvents(queueName, { connection: redisConnection });

    queueEvents.on('completed', ({ jobId }) => {
        logger.info('[QUEUE] Job completed', { queue: queueName, jobId });
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
        logger.error('[QUEUE] Job failed', { queue: queueName, jobId, reason: failedReason });
    });

    queueEvents.on('stalled', ({ jobId }) => {
        logger.warn('[QUEUE] Job stalled', { queue: queueName, jobId });
    });

    return queueEvents;
};

// ========================================
// CLOUDINARY RETRY QUEUE (Phase 1)
// ========================================

export const cloudinaryRetryQueue = createQueue<CloudinaryRetryJob>(QUEUE_NAMES.CLOUDINARY_RETRY, {
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 }
    }
});

export const cloudinaryRetryWorker = createWorker<CloudinaryRetryJob>(
    QUEUE_NAMES.CLOUDINARY_RETRY,
    async (job: Job<CloudinaryRetryJob>) => {
        const { localPath, originalPublicId, resourceType, format } = job.data;

        logger.info('[QUEUE] Processing Cloudinary retry', {
            jobId: job.id,
            attempt: job.attemptsMade + 1
        });

        const buffer = await fs.readFile(localPath);
        const result = await safeCloudinaryService.uploadFile(buffer, {
            resource_type: resourceType,
            public_id: originalPublicId,
            format: format || 'pdf'
        });

        await fs.unlink(localPath);

        return { success: true, publicId: result.public_id, url: result.secure_url };
    },
    {
        concurrency: 5,
        limiter: { max: 10, duration: 1000 }
    }
);

// ========================================
// EMAIL SENDING QUEUE (Phase 2)
// ========================================

export const emailQueue = createQueue<EmailJob>(QUEUE_NAMES.EMAIL_SENDING, {
    defaultJobOptions: {
        attempts: 3,                     // Retry failed emails 3 times
        backoff: { type: 'exponential', delay: 10000 },  // 10s, 20s, 40s
        removeOnComplete: { age: 24 * 3600, count: 5000 },
        removeOnFail: { age: 7 * 24 * 3600 }
    }
});

export const emailWorker = createWorker<EmailJob>(
    QUEUE_NAMES.EMAIL_SENDING,
    async (job: Job<EmailJob>) => {
        const { to, subject, html, text, templateName } = job.data;

        logger.info('[QUEUE] Processing email', {
            jobId: job.id,
            to,
            template: templateName,
            attempt: job.attemptsMade + 1
        });

        // Import emailService (dynamic import to avoid circular dependency)
        const { sendEmail } = await import('./emailService');

        const result = await sendEmail({ to, subject, html, text });

        if (!result.success) {
            throw new Error(result.error || 'Email send failed');
        }

        return { success: true, messageId: result.messageId };
    },
    {
        concurrency: 10,                 // Process 10 emails concurrently
        limiter: { max: 50, duration: 1000 }  // Max 50 emails/second (SMTP rate limit)
    }
);

// ========================================
// NOTIFICATION BROADCAST QUEUE (Phase 2)
// ========================================

export const notificationBroadcastQueue = createQueue<NotificationBroadcastJob>(QUEUE_NAMES.NOTIFICATION_BROADCAST, {
    defaultJobOptions: {
        attempts: 2,                     // Retry once
        backoff: { type: 'fixed', delay: 30000 },  // 30s delay
        removeOnComplete: { age: 24 * 3600, count: 100 },
        removeOnFail: { age: 3 * 24 * 3600 }
    }
});

export const notificationBroadcastWorker = createWorker<NotificationBroadcastJob>(
    QUEUE_NAMES.NOTIFICATION_BROADCAST,
    async (job: Job<NotificationBroadcastJob>) => {
        const { broadcastId } = job.data;

        logger.info('[QUEUE] Processing notification broadcast', {
            jobId: job.id,
            broadcastId,
            attempt: job.attemptsMade + 1
        });

        // Import notificationService
        const { notificationService } = await import('./notificationService');

        // Process broadcast (atomic claiming prevents double-processing)
        const result = await notificationService.processPendingBroadcasts();

        return {
            success: true,
            processed: result.processed,
            errors: result.errors.length
        };
    },
    {
        concurrency: 2,                  // Process 2 broadcasts concurrently (DB intensive)
        limiter: { max: 5, duration: 1000 }   // Max 5/second
    }
);

// ========================================
// BACKUP PROCESSING QUEUE (Phase 2)
// ========================================

export const backupQueue = createQueue<BackupJob>(QUEUE_NAMES.BACKUP_PROCESSING, {
    defaultJobOptions: {
        attempts: 2,                     // Retry once
        backoff: { type: 'fixed', delay: 300000 },  // 5 minutes
        removeOnComplete: { age: 7 * 24 * 3600, count: 100 },
        removeOnFail: { age: 30 * 24 * 3600 }  // Keep 30 days
    }
});

export const backupWorker = createWorker<BackupJob>(
    QUEUE_NAMES.BACKUP_PROCESSING,
    async (job: Job<BackupJob>) => {
        const { type, priority } = job.data;

        logger.info('[QUEUE] Processing database backup', {
            jobId: job.id,
            type,
            priority,
            attempt: job.attemptsMade + 1
        });

        // Import DatabaseBackupService
        const { DatabaseBackupService } = await import('./databaseBackupService');

        // Initialize if not already
        await DatabaseBackupService.initialize();

        // Create backup
        const result = await DatabaseBackupService.createFullBackup();

        if (!result.success) {
            throw new Error(result.error || 'Backup failed');
        }

        return {
            success: true,
            backupFile: result.backupFile,
            sizeBytes: result.sizeBytes,
            s3Key: result.s3Key
        };
    },
    {
        concurrency: 1,                  // Process 1 backup at a time (resource intensive)
        limiter: { max: 1, duration: 60000 }  // Max 1/minute
    }
);

// ========================================
// PDF PROCESSING QUEUE (Phase 3 - Infrastructure)
// ========================================

export const pdfProcessingQueue = createQueue<PDFProcessingJob>(QUEUE_NAMES.PDF_PROCESSING, {
    defaultJobOptions: {
        attempts: 2,                     // Retry once
        backoff: { type: 'fixed', delay: 60000 },  // 1 minute
        removeOnComplete: { age: 7 * 24 * 3600, count: 100 },
        removeOnFail: { age: 30 * 24 * 3600 }
    }
});

export const pdfProcessingWorker = createWorker<PDFProcessingJob>(
    QUEUE_NAMES.PDF_PROCESSING,
    async (job: Job<PDFProcessingJob>) => {
        const { noteId, pdfUrl, operations, priority } = job.data;

        logger.info('[QUEUE] Processing PDF job', {
            jobId: job.id,
            noteId,
            operations,
            priority,
            attempt: job.attemptsMade + 1
        });

        try {
            const response = await fetch(pdfUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF: ${response.statusText}`);
            }

            const pdfBuffer = Buffer.from(await response.arrayBuffer());

            logger.info('[PDF] PDF fetched', {
                size: pdfBuffer.length,
                operations: operations.length
            });

            const { pdfProcessingService } = await import('./pdfProcessingService');

            const results = await pdfProcessingService.processPDF(pdfBuffer, operations);

            logger.info('[PDF] Processing complete', {
                noteId,
                ocrSuccess: results.ocr?.success,
                thumbnailSuccess: results.thumbnail?.success,
                compressionSuccess: results.compression?.success
            });

            return {
                success: true,
                noteId,
                operations,
                results
            };

        } catch (error: any) {
            logger.error('[PDF] Processing failed', {
                noteId,
                error: error.message
            });
            throw error;
        }
    },
    {
        concurrency: 3,                  // Process 3 PDFs concurrently
        limiter: { max: 5, duration: 60000 }  // Max 5 PDFs/minute
    }
);

// ========================================
// ANALYTICS AGGREGATION QUEUE (Phase 3)
// ========================================

export const analyticsQueue = createQueue<AnalyticsJob>(QUEUE_NAMES.ANALYTICS_AGGREGATION, {
    defaultJobOptions: {
        attempts: 3,                     // Retry 3 times
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 }
    }
});

export const analyticsWorker = createWorker<AnalyticsJob>(
    QUEUE_NAMES.ANALYTICS_AGGREGATION,
    async (job: Job<AnalyticsJob>) => {
        const { type, entityType, entityId, data } = job.data;

        logger.info('[QUEUE] Processing analytics aggregation', {
            jobId: job.id,
            type,
            entityType,
            entityId
        });

        // Import prisma for database operations
        const { prisma } = await import('../config/database');
        const prismaAny = prisma as any;

        // Get current date
        const dateKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Process based on type
        if (type === 'page_view') {
            // Upsert page view count to analytics_daily table
            await prismaAny.analytics_daily.upsert({
                where: {
                    date_entity_unique: {
                        date: dateKey,
                        entity_type: entityType,
                        entity_id: entityId
                    }
                },
                update: {
                    views: { increment: 1 },
                    updated_at: new Date()
                },
                create: {
                    date: dateKey,
                    entity_type: entityType,
                    entity_id: entityId,
                    views: 1,
                    revenue: 0,
                    conversions: 0
                }
            });

            logger.info('[ANALYTICS] Page view recorded to database', {
                date: dateKey,
                entityType,
                entityId
            });
        }
        // TODO: Implement revenue and activity tracking

        return {
            success: true,
            type,
            entityType,
            entityId,
            status: 'aggregated'
        };
    },
    {
        concurrency: 5,                  // Process 5 analytics jobs concurrently
        limiter: { max: 100, duration: 1000 }  // Max 100/second
    }
);

// ========================================
// QUEUE EVENTS MONITORING
// ========================================

const cloudinaryEvents = setupQueueEvents(QUEUE_NAMES.CLOUDINARY_RETRY);
const emailEvents = setupQueueEvents(QUEUE_NAMES.EMAIL_SENDING);
const notificationEvents = setupQueueEvents(QUEUE_NAMES.NOTIFICATION_BROADCAST);
const backupEvents = setupQueueEvents(QUEUE_NAMES.BACKUP_PROCESSING);
const pdfEvents = setupQueueEvents(QUEUE_NAMES.PDF_PROCESSING);            // Phase 3
const analyticsEvents = setupQueueEvents(QUEUE_NAMES.ANALYTICS_AGGREGATION); // Phase 3

// ========================================
// WORKER EVENTS
// ========================================
/**
 * Broadcast Queues (for million-user campaigns)
 */
const broadcastQueue = createQueue<BroadcastJob>('broadcast');
const broadcastBatchQueue = createQueue<BroadcastBatchJob>('broadcast-batch');

/**
 * Add broadcast job
 */
export async function addBroadcastJob(data: BroadcastJob) {
    if (!broadcastQueue.add) return; // Guard for mock
    await broadcastQueue.add('send-broadcast', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });
    logger.info(`📢 Broadcast job queued for campaign ${data.campaignId}`);
}

/**
 * Add broadcast batch job (for large campaigns)
 */
export async function addBroadcastBatchJob(data: BroadcastBatchJob) {
    if (!broadcastBatchQueue.add) return;
    await broadcastBatchQueue.add('send-batch', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });
    logger.info(`📦 Broadcast batch queued: ${data.userIds.length} users via ${data.channel}`);
}

[cloudinaryRetryWorker, emailWorker, notificationBroadcastWorker, backupWorker, pdfProcessingWorker, analyticsWorker].forEach((worker, index) => {
    const queueName = Object.values(QUEUE_NAMES)[index];

    // Check if mock
    if (!worker.on) return;

    worker.on('failed', (job: any, error: any) => {
        logger.error('[WORKER] Job failed', {
            queue: queueName,
            jobId: job?.id,
            error: error.message,
            attempts: job?.attemptsMade
        });

        // Alert on final failure
        if (job && job.attemptsMade >= (job.opts.attempts || 3)) {
            alertService.sendAlert({
                severity: 'HIGH',
                event: 'QUEUE_JOB_FINAL_FAILURE',
                message: `Queue job failed after all retries: ${queueName}/${job.id}`,
                metadata: { queue: queueName, jobId: job.id, error: error.message }
            });
        }
    });
});

// ========================================
// PUBLIC API
// ========================================

export const queueService = {
    // Cloudinary retry (Phase 1)
    async addCloudinaryRetry(
        localPath: string,
        originalPublicId: string,
        resourceType: 'raw' | 'image' | 'video' | 'auto' = 'raw',
        format?: string
    ): Promise<string> {
        const job = await cloudinaryRetryQueue.add('retry-upload', {
            localPath, originalPublicId, resourceType, format
        }, { priority: 1, delay: 60000 });

        logger.info('[QUEUE] Added Cloudinary retry', { jobId: job?.id });
        return job?.id || 'unknown';
    },

    // Email sending (Phase 2)
    async addEmailJob(
        to: string,
        subject: string,
        html: string,
        text?: string,
        templateName?: string,
        priority?: number
    ): Promise<string> {
        const job = await emailQueue.add('send-email', {
            to, subject, html, text, templateName
        }, {
            priority: priority || 2,     // Normal priority by default
            delay: 0                      // Immediate processing
        });

        logger.info('[QUEUE] Added email job', { jobId: job?.id, to, template: templateName });
        return job?.id || 'unknown';
    },

    // Notification broadcast (Phase 2)
    async addNotificationBroadcast(broadcastId: string): Promise<string> {
        const job = await notificationBroadcastQueue.add('process-broadcast', {
            broadcastId
        }, { priority: 1, delay: 0 });

        logger.info('[QUEUE] Added notification broadcast', { jobId: job?.id, broadcastId });
        return job?.id || 'unknown';
    },

    // Backup processing (Phase 2)
    async addBackupJob(
        type: 'full' | 'incremental' = 'full',
        priority: 'high' | 'normal' | 'low' = 'normal'
    ): Promise<string> {
        const priorityMap = { high: 1, normal: 2, low: 3 };

        const job = await backupQueue.add('create-backup', {
            type, priority
        }, {
            priority: priorityMap[priority],
            delay: priority === 'high' ? 0 : 60000  // High priority: immediate, others: 1 min
        });

        logger.info('[QUEUE] Added backup job', { jobId: job?.id, type, priority });
        return job?.id || 'unknown';
    },

    // Queue statistics
    async getQueueStats() {
        if (!isRedisConfigured) return {};

        const stats = await Promise.all([
            cloudinaryRetryQueue.getWaitingCount(),
            cloudinaryRetryQueue.getActiveCount(),
            cloudinaryRetryQueue.getCompletedCount(),
            cloudinaryRetryQueue.getFailedCount(),
            emailQueue.getWaitingCount(),
            emailQueue.getActiveCount(),
            emailQueue.getCompletedCount(),
            emailQueue.getFailedCount(),
            notificationBroadcastQueue.getWaitingCount(),
            notificationBroadcastQueue.getActiveCount(),
            notificationBroadcastQueue.getCompletedCount(),
            notificationBroadcastQueue.getFailedCount(),
            backupQueue.getWaitingCount(),
            backupQueue.getActiveCount(),
            backupQueue.getCompletedCount(),
            backupQueue.getFailedCount()
        ]);

        return {
            [QUEUE_NAMES.CLOUDINARY_RETRY]: {
                waiting: stats[0], active: stats[1], completed: stats[2], failed: stats[3],
                total: stats[0] + stats[1] + stats[2] + stats[3]
            },
            [QUEUE_NAMES.EMAIL_SENDING]: {
                waiting: stats[4], active: stats[5], completed: stats[6], failed: stats[7],
                total: stats[4] + stats[5] + stats[6] + stats[7]
            },
            [QUEUE_NAMES.NOTIFICATION_BROADCAST]: {
                waiting: stats[8], active: stats[9], completed: stats[10], failed: stats[11],
                total: stats[8] + stats[9] + stats[10] + stats[11]
            },
            [QUEUE_NAMES.BACKUP_PROCESSING]: {
                waiting: stats[12], active: stats[13], completed: stats[14], failed: stats[15],
                total: stats[12] + stats[13] + stats[14] + stats[15]
            }
        };
    },

    // Graceful shutdown
    async shutdown(): Promise<void> {
        logger.info('[QUEUE] Shutting down queue service...');
        if (!isRedisConfigured) return;

        await Promise.all([
            cloudinaryRetryWorker.close(),
            emailWorker.close(),
            notificationBroadcastWorker.close(),
            backupWorker.close(),
            cloudinaryRetryQueue.close(),
            emailQueue.close(),
            notificationBroadcastQueue.close(),
            backupQueue.close(),
            cloudinaryEvents.close(),
            emailEvents.close(),
            notificationEvents.close(),
            backupEvents.close()
        ]);

        logger.info('[QUEUE] Queue service shut down successfully');
    }
};

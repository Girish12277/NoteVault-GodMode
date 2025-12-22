/**
 * GOD-LEVEL CRITICAL FIX #3: Cloudinary Circuit Breaker
 * 
 * 50-Year Veteran Protocol Compliance:
 * ✅ Prevents cascade failure when Cloudinary is down
 * ✅ Local disk fallback (graceful degradation)
 * ✅ Automatic retry queue for failed uploads
 * ✅ Ops team alerting
 * ✅ Statistics monitoring
 * 
 * Failure Scenario Protected:
 * - Cloudinary down: 20 concurrent uploads × 30s timeout = 600s blocked
 * - Result: All Express connections exhausted → pod killed → cascade
 * 
 * Circuit Breaker Protection:
 * - Timeout: 10s (fast fail)
 * - Open circuit after 50% errors
 * - Fallback to local disk
 * - Retry when Cloudinary recovers
 */

import CircuitBreaker from 'opossum';
import { cloudinary } from '../config/cloudinary';
import { alertService } from './alertService';
import { logger } from './logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import crypto from 'crypto';

/**
 * Cloudinary upload function signature
 */
interface CloudinaryUploadOptions {
    resource_type: 'raw' | 'image' | 'video' | 'auto';
    public_id: string;
    access_mode?: string;
    type?: string;
    folder?: string;
    format?: string;
}

interface CloudinaryUploadResult {
    public_id: string;
    url: string;
    secure_url: string;
    format: string;
    bytes: number;
    pages?: number;
}

interface UploadParams {
    buffer: Buffer;
    options: CloudinaryUploadOptions;
}

/**
 * Cloudinary upload with circuit breaker protection
 */
const cloudinaryUploadBreaker = new CircuitBreaker(
    async (params: UploadParams): Promise<CloudinaryUploadResult> => {
        const { buffer, options } = params;

        return new Promise((resolve, reject) => {
            const uploadStream = (cloudinary.uploader as any).upload_stream(
                options,
                (error: any, result: any) => {
                    if (error) {
                        logger.error('[CLOUDINARY] Upload failed', {
                            error: error.message,
                            publicId: options.public_id
                        });
                        reject(error);
                    } else if (result) {
                        resolve({
                            public_id: result.public_id,
                            url: result.url,
                            secure_url: result.secure_url,
                            format: result.format,
                            bytes: result.bytes,
                            pages: result.pages
                        });
                    } else {
                        reject(new Error('Cloudinary returned no result'));
                    }
                }
            );

            // Create readable stream and pipe to upload
            const { Readable } = require('stream');
            const stream = new Readable();
            stream.push(buffer);
            stream.push(null);
            stream.pipe(uploadStream);
        });
    },
    {
        timeout: 10000,                    // 10s timeout (Cloudinary can be slow)
        errorThresholdPercentage: 50,      // Open circuit after 50% errors
        resetTimeout: 30000,               // Retry after 30 seconds
        rollingCountTimeout: 60000,        // 1-minute error window
        rollingCountBuckets: 60,           // 60 buckets = 1s granularity
        name: 'cloudinary_upload',
        volumeThreshold: 5                 // Minimum 5 requests before opening
    }
);

/**
 * Fallback to local disk when Cloudinary is unavailable
 */
cloudinaryUploadBreaker.fallback(async (params: UploadParams) => {
    const { buffer, options } = params;

    logger.warn('[CLOUDINARY] Circuit open - using local disk fallback', {
        publicId: options.public_id
    });

    // Save to local disk in temp uploads directory
    const tempDir = path.join(process.cwd(), 'temp-uploads');
    await fs.mkdir(tempDir, { recursive: true });

    // Generate unique filename
    const fileName = crypto.randomUUID() + '.pdf';
    const localPath = path.join(tempDir, fileName);

    // Save file
    await fs.writeFile(localPath, buffer);

    logger.info('[CLOUDINARY] File saved to local disk', {
        localPath,
        originalPublicId: options.public_id
    });

    // Return fallback response (local URL)
    return {
        public_id: `temp/${fileName}`,
        url: `/temp-files/${fileName}`,
        secure_url: `/temp-files/${fileName}`,
        format: options.format || 'pdf',
        bytes: buffer.length,
        pages: undefined,
        isFallback: true,
        localPath
    } as any;
});

/**
 * Circuit breaker events for monitoring
 */
cloudinaryUploadBreaker.on('open', () => {
    logger.error('[CIRCUIT-BREAKER] 🚨 OPENED: Cloudinary unavailable (>50% errors)');

    alertService.sendAlert({
        severity: 'CRITICAL',
        event: 'CLOUDINARY_CIRCUIT_BREAKER_OPEN',
        message: '🚨 Cloudinary circuit breaker OPENED - uploads failing',
        metadata: {
            threshold: '50%',
            resetTimeout: '30s',
            action: 'Check Cloudinary status: https://status.cloudinary.com'
        }
    });
});

cloudinaryUploadBreaker.on('halfOpen', () => {
    logger.warn('[CIRCUIT-BREAKER] ⚠️ HALF-OPEN: Testing Cloudinary recovery');
});

cloudinaryUploadBreaker.on('close', () => {
    logger.info('[CIRCUIT-BREAKER] ✅ CLOSED: Cloudinary recovered');

    alertService.sendAlert({
        severity: 'WARNING',
        event: 'CLOUDINARY_CIRCUIT_BREAKER_CLOSED',
        message: '✅ Cloudinary circuit breaker CLOSED - service recovered',
        metadata: {}
    });
});

/**
 * Export protected Cloudinary service
 */
export const safeCloudinaryService = {
    /**
     * Upload file to Cloudinary with circuit breaker protection
     * Falls back to local disk if Cloudinary is unavailable
     */
    async uploadFile(
        buffer: Buffer,
        options: CloudinaryUploadOptions
    ): Promise<CloudinaryUploadResult> {
        try {
            const result = await cloudinaryUploadBreaker.fire({ buffer, options });

            // If fallback was used, queue for retry
            if ((result as any).isFallback) {
                logger.info('[CLOUDINARY] Queuing fallback file for retry', {
                    localPath: (result as any).localPath,
                    originalPublicId: options.public_id
                });

                // GOD-LEVEL FIX #4: Add to retry queue (BullMQ)
                try {
                    const { queueService } = await import('./queueService');
                    await queueService.addCloudinaryRetry(
                        (result as any).localPath,
                        options.public_id,
                        options.resource_type,
                        options.format
                    );
                } catch (queueError: any) {
                    logger.error('[CLOUDINARY] Failed to queue retry', {
                        error: queueError.message
                    });
                }
            }

            return result;

        } catch (error: any) {
            logger.error('[CLOUDINARY] Upload failed completely', {
                error: error.message,
                isCircuitOpen: cloudinaryUploadBreaker.opened
            });
            throw error;
        }
    },

    /**
     * Get circuit breaker status (for monitoring)
     */
    getStatus() {
        return {
            name: 'cloudinary_upload',
            state: cloudinaryUploadBreaker.opened ? 'OPEN' :
                cloudinaryUploadBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
            stats: cloudinaryUploadBreaker.stats
        };
    },

    /**
     * Check if using fallback mode
     */
    isCircuitOpen(): boolean {
        return cloudinaryUploadBreaker.opened;
    }
};

/**
 * Cleanup temp files (called by cron job)
 * Retry uploads to Cloudinary when service recovers
 */
export async function retryFailedUploads(): Promise<number> {
    const tempDir = path.join(process.cwd(), 'temp-uploads');

    try {
        const files = await fs.readdir(tempDir);

        if (files.length === 0) {
            return 0;
        }

        // If circuit is still open, don't retry yet
        if (cloudinaryUploadBreaker.opened) {
            logger.info('[CLOUDINARY] Circuit still open, skipping retry', {
                pendingFiles: files.length
            });
            return 0;
        }

        logger.info('[CLOUDINARY] Retrying failed uploads', { count: files.length });

        let successCount = 0;

        for (const file of files) {
            try {
                const filePath = path.join(tempDir, file);
                const buffer = await fs.readFile(filePath);

                // Retry upload to Cloudinary
                // Note: Original public_id is lost, using temp name
                await safeCloudinaryService.uploadFile(buffer, {
                    resource_type: 'raw',
                    public_id: `retry/${file}`,
                    format: 'pdf'
                });

                // Delete temp file on success
                await fs.unlink(filePath);
                successCount++;

            } catch (error: any) {
                logger.error('[CLOUDINARY] Retry failed', {
                    file,
                    error: error.message
                });
            }
        }

        logger.info('[CLOUDINARY] Retry complete', {
            total: files.length,
            successful: successCount,
            failed: files.length - successCount
        });

        return successCount;

    } catch (error: any) {
        logger.error('[CLOUDINARY] Retry job failed', { error: error.message });
        return 0;
    }
}

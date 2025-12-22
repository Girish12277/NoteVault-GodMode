import crypto from 'crypto';
import { prisma } from '../config/database';
import { multiEmailService } from './multiProviderEmailService';
import { whatsappService } from './whatsappService';

/**
 * GOD-LEVEL BROADCAST SERVICE
 * Million-user scalability with queue-based processing
 * 
 * Features:
 * - Admin custom messaging
 * - Bulk campaigns (millions of users)
 * - Multi-channel (email + WhatsApp)
 * - Progress tracking
 * - Batch processing (10k users/batch)
 */

export interface CustomMessageOptions {
    userIds: string[];
    channels: ('email' | 'whatsapp')[];
    subject?: string; // For email
    message: string;
    mediaUrl?: string; // For WhatsApp
    adminId: string;
}

export interface BulkCampaignOptions {
    name: string;
    channels: ('email' | 'whatsapp')[];
    subject?: string;
    message: string;
    mediaUrl?: string;
    segmentation: {
        type: 'all' | 'userIds' | 'query';
        userIds?: string[];
        query?: any; // Prisma query filters
    };
    adminId: string;
    schedule?: Date; // Future: scheduled campaigns
}

export interface CampaignStatus {
    id: string;
    name: string;
    status: string;
    totalUsers: number;
    processedUsers: number;
    succeededUsers: number;
    failedUsers: number;
    progressPercent: number;
    startedAt?: Date;
    completedAt?: Date;
    estimatedCompletion?: Date;
}

class BroadcastService {
    /**
     * Send custom message to specific users
     */
    async sendCustomMessage(options: CustomMessageOptions): Promise<{ success: boolean; campaignId?: string; error?: string }> {
        try {
            console.log(`📢 Sending custom message to ${options.userIds.length} users via ${options.channels.join(', ')}`);

            // Create campaign
            const campaign = await (prisma as any).broadcast_campaigns.create({
                data: {
                    id: crypto.randomBytes(8).toString('hex'),
                    name: `Custom Message - ${new Date().toISOString()}`,
                    type: 'custom',
                    channels: options.channels,
                    subject: options.subject,
                    message: options.message,
                    media_url: options.mediaUrl,
                    segmentation_type: 'userIds',
                    segmentation_data: { userIds: options.userIds },
                    total_users: options.userIds.length,
                    created_by_admin_id: options.adminId,
                    status: 'queued',
                    created_at: new Date(),
                },
            });

            // Queue broadcast job
            const { addBroadcastJob } = await import('./queueService');
            await addBroadcastJob({
                campaignId: campaign.id,
                userIds: options.userIds,
                channels: options.channels,
                subject: options.subject,
                message: options.message,
                mediaUrl: options.mediaUrl,
            });

            console.log(`✅ Campaign ${campaign.id} queued`);

            return {
                success: true,
                campaignId: campaign.id,
            };
        } catch (error: any) {
            console.error('❌ Custom message failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Create bulk broadcast campaign
     */
    async createCampaign(options: BulkCampaignOptions): Promise<{ success: boolean; campaignId?: string; error?: string }> {
        try {
            console.log(`📢 Creating bulk campaign: ${options.name}`);

            // Segment users
            const users = await this.segmentUsers(options.segmentation);

            if (!users || users.length === 0) {
                return {
                    success: false,
                    error: 'No users found matching segmentation criteria',
                };
            }

            console.log(`👥 Found ${users.length} users for campaign`);

            // Create campaign
            const campaign = await (prisma as any).broadcast_campaigns.create({
                data: {
                    id: crypto.randomBytes(8).toString('hex'),
                    name: options.name,
                    type: 'bulk',
                    channels: options.channels,
                    subject: options.subject,
                    message: options.message,
                    media_url: options.mediaUrl,
                    segmentation_type: options.segmentation.type,
                    segmentation_data: options.segmentation,
                    total_users: users.length,
                    created_by_admin_id: options.adminId,
                    status: 'queued',
                    created_at: new Date(),
                },
            });

            // Batch users (10k per batch)
            const batches = this.batchUsers(users, 10000);

            console.log(`📦 Split into ${batches.length} batches`);

            // Update campaign with batch count
            await (prisma as any).broadcast_campaigns.update({
                where: { id: campaign.id },
                data: { total_batches: batches.length },
            });

            // Queue batches
            const { addBroadcastBatchJob } = await import('./queueService');

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];

                // Create batch record
                const batchRecord = await (prisma as any).broadcast_batches.create({
                    data: {
                        id: crypto.randomBytes(8).toString('hex'),
                        campaign_id: campaign.id,
                        batch_number: i + 1,
                        user_ids: batch,
                        batch_size: batch.length,
                        channel: options.channels[0], // Primary channel
                        status: 'queued',
                        created_at: new Date(),
                    },
                });

                // Queue batch job for each channel
                for (const channel of options.channels) {
                    await addBroadcastBatchJob({
                        campaignId: campaign.id,
                        batchId: batchRecord.id,
                        userIds: batch,
                        channel,
                        subject: options.subject,
                        message: options.message,
                        mediaUrl: options.mediaUrl,
                    });
                }
            }

            console.log(`✅ Campaign ${campaign.id} queued with ${batches.length} batches`);

            return {
                success: true,
                campaignId: campaign.id,
            };
        } catch (error: any) {
            console.error('❌ Campaign creation failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get campaign status with progress
     */
    async getCampaignStatus(campaignId: string): Promise<CampaignStatus | null> {
        try {
            const campaign = await (prisma as any).broadcast_campaigns.findUnique({
                where: { id: campaignId },
            });

            if (!campaign) {
                return null;
            }

            return {
                id: campaign.id,
                name: campaign.name,
                status: campaign.status,
                totalUsers: campaign.total_users,
                processedUsers: campaign.processed_users,
                succeededUsers: campaign.succeeded_users,
                failedUsers: campaign.failed_users,
                progressPercent: parseFloat(campaign.progress_percent || '0'),
                startedAt: campaign.started_at,
                completedAt: campaign.completed_at,
                estimatedCompletion: campaign.estimated_completion,
            };
        } catch (error) {
            console.error('Failed to get campaign status:', error);
            return null;
        }
    }

    /**
     * Segment users based on criteria
     */
    private async segmentUsers(segmentation: BulkCampaignOptions['segmentation']): Promise<string[]> {
        try {
            if (segmentation.type === 'userIds') {
                return segmentation.userIds || [];
            }

            if (segmentation.type === 'all') {
                const users = await (prisma as any).users.findMany({
                    where: { is_active: true },
                    select: { id: true },
                });
                return users.map((u: any) => u.id);
            }

            if (segmentation.type === 'query') {
                const users = await (prisma as any).users.findMany({
                    where: segmentation.query,
                    select: { id: true },
                });
                return users.map((u: any) => u.id);
            }

            return [];
        } catch (error) {
            console.error('User segmentation failed:', error);
            return [];
        }
    }

    /**
     * Batch users into chunks
     */
    private batchUsers(userIds: string[], batchSize: number): string[][] {
        const batches: string[][] = [];

        for (let i = 0; i < userIds.length; i += batchSize) {
            batches.push(userIds.slice(i, i + batchSize));
        }

        return batches;
    }

    /**
     * Update campaign progress
     */
    async updateCampaignProgress(
        campaignId: string,
        processed: number,
        succeeded: number,
        failed: number
    ): Promise<void> {
        try {
            const campaign = await (prisma as any).broadcast_campaigns.findUnique({
                where: { id: campaignId },
            });

            if (!campaign) return;

            const newProcessed = (campaign.processed_users || 0) + processed;
            const newSucceeded = (campaign.succeeded_users || 0) + succeeded;
            const newFailed = (campaign.failed_users || 0) + failed;
            const total = campaign.total_users || 1; // Prevent division by zero
            const progress = (newProcessed / total) * 100;

            const updates: any = {
                processed_users: newProcessed,
                succeeded_users: newSucceeded,
                failed_users: newFailed,
                progress_percent: progress.toFixed(2),
                updated_at: new Date(),
            };

            // Mark as processing if not already
            if (campaign.status === 'queued') {
                updates.status = 'processing';
                updates.started_at = new Date();
            }

            // Mark as completed if all processed
            if (newProcessed >= campaign.total_users) {
                updates.status = 'completed';
                updates.completed_at = new Date();
            }

            await (prisma as any).broadcast_campaigns.update({
                where: { id: campaignId },
                data: updates,
            });

            console.log(`📊 Campaign ${campaignId}: ${progress.toFixed(1)}% (${newProcessed}/${campaign.total_users})`);
        } catch (error) {
            console.error('Failed to update campaign progress:', error);
        }
    }

    /**
     * Cancel campaign
     */
    async cancelCampaign(campaignId: string): Promise<boolean> {
        try {
            await (prisma as any).broadcast_campaigns.update({
                where: { id: campaignId },
                data: {
                    status: 'cancelled',
                    updated_at: new Date(),
                },
            });

            console.log(`🛑 Campaign ${campaignId} cancelled`);
            return true;
        } catch (error) {
            console.error('Failed to cancel campaign:', error);
            return false;
        }
    }

    /**
     * Get all campaigns (for admin dashboard)
     */
    async getCampaigns(filters?: {
        status?: string;
        adminId?: string;
        limit?: number;
    }): Promise<any[]> {
        try {
            const where: any = {};

            if (filters?.status) {
                where.status = filters.status;
            }

            if (filters?.adminId) {
                where.created_by_admin_id = filters.adminId;
            }

            const campaigns = await (prisma as any).broadcast_campaigns.findMany({
                where,
                orderBy: { created_at: 'desc' },
                take: filters?.limit || 50,
            });

            return campaigns;
        } catch (error) {
            console.error('Failed to get campaigns:', error);
            return [];
        }
    }
}

// Singleton instance
export const broadcastService = new BroadcastService();

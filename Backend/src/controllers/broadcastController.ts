import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { broadcastService } from '../services/broadcastService';
import { z } from 'zod';

/**
 * GOD-LEVEL BROADCAST ADMIN CONTROLLER
 * Admin-only endpoints for million-user campaigns
 */

// Validation schemas
const sendCustomMessageSchema = z.object({
    userIds: z.array(z.string()).min(1).max(1000), // Max 1000 for custom messages
    channels: z.array(z.enum(['email', 'whatsapp'])).min(1),
    subject: z.string().optional(),
    message: z.string().min(1).max(5000),
    mediaUrl: z.string().url().optional(),
});

const createCampaignSchema = z.object({
    name: z.string().min(1).max(200),
    channels: z.array(z.enum(['email', 'whatsapp'])).min(1),
    subject: z.string().optional(),
    message: z.string().min(1).max(5000),
    mediaUrl: z.string().url().optional(),
    segmentation: z.object({
        type: z.enum(['all', 'userIds', 'query']),
        userIds: z.array(z.string()).optional(),
        query: z.any().optional(), // Fixed: was z.record(z.any())
    }),
});

export const broadcastController = {
    /**
     * POST /api/admin/broadcast/send-custom
     * Send custom message to specific users
     */
    async sendCustomMessage(req: AuthRequest, res: Response) {
        try {
            const validation = sendCustomMessageSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validation.error.issues,
                });
            }

            const { userIds, channels, subject, message, mediaUrl } = validation.data;
            const adminId = req.user!.id;

            console.log(`📢 Admin ${adminId} sending custom message to ${userIds.length} users`);

            const result = await broadcastService.sendCustomMessage({
                userIds,
                channels,
                subject,
                message,
                mediaUrl,
                adminId,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Failed to send custom message',
                });
            }

            return res.json({
                success: true,
                campaignId: result.campaignId,
                message: 'Custom message queued successfully',
            });
        } catch (error: any) {
            console.error('Send custom message error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send custom message',
            });
        }
    },

    /**
     * POST /api/admin/broadcast/create-campaign
     * Create bulk broadcast campaign
     */
    async createCampaign(req: AuthRequest, res: Response) {
        try {
            const validation = createCampaignSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid request data',
                    details: validation.error.issues,
                });
            }

            const { name, channels, subject, message, mediaUrl, segmentation } = validation.data;
            const adminId = req.user!.id;

            console.log(`📢 Admin ${adminId} creating campaign: ${name}`);

            const result = await broadcastService.createCampaign({
                name,
                channels,
                subject,
                message,
                mediaUrl,
                segmentation,
                adminId,
            });

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Failed to create campaign',
                });
            }

            return res.json({
                success: true,
                campaignId: result.campaignId,
                message: 'Campaign created and queued successfully',
            });
        } catch (error: any) {
            console.error('Create campaign error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create campaign',
            });
        }
    },

    /**
     * GET /api/admin/broadcast/campaigns
     * List all campaigns
     */
    async getCampaigns(req: AuthRequest, res: Response) {
        try {
            const { status, limit } = req.query;
            const adminId = req.user!.id;

            const campaigns = await broadcastService.getCampaigns({
                status: status as string | undefined,
                adminId,
                limit: limit ? parseInt(limit as string) : undefined,
            });

            return res.json({
                success: true,
                data: campaigns,
            });
        } catch (error: any) {
            console.error('Get campaigns error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch campaigns',
            });
        }
    },

    /**
     * GET /api/admin/broadcast/campaigns/:id
     * Get campaign status with progress
     */
    async getCampaignStatus(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const campaign = await broadcastService.getCampaignStatus(id);

            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    error: 'Campaign not found',
                });
            }

            return res.json({
                success: true,
                data: campaign,
            });
        } catch (error: any) {
            console.error('Get campaign status error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch campaign status',
            });
        }
    },

    /**
     * DELETE /api/admin/broadcast/campaigns/:id
     * Cancel campaign
     */
    async cancelCampaign(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;

            const result = await broadcastService.cancelCampaign(id);

            if (!result) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to cancel campaign',
                });
            }

            return res.json({
                success: true,
                message: 'Campaign cancelled successfully',
            });
        } catch (error: any) {
            console.error('Cancel campaign error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to cancel campaign',
            });
        }
    },
};

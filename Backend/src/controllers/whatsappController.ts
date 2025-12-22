import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { whatsappService } from '../services/whatsappService';
import { prisma } from '../config/database';

/**
 * GOD-LEVEL WHATSAPP ADMIN CONTROLLER
 * Admin endpoints for WhatsApp management and monitoring
 */
export const whatsappController = {
    /**
     * GET /api/admin/whatsapp/stats
     * Get WhatsApp statistics
     */
    async getStats(req: AuthRequest, res: Response) {
        try {
            const stats = await whatsappService.getStats();

            if (!stats) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to fetch stats',
                });
            }

            // Get recent messages
            const recentMessages = await (prisma as any).whatsapp_messages.findMany({
                orderBy: { sent_at: 'desc' },
                take: 50,
                select: {
                    id: true,
                    to_phone: true,
                    body: true,
                    status: true,
                    template_name: true,
                    sent_at: true,
                    delivered_at: true,
                    read_at: true,
                },
            });

            return res.json({
                success: true,
                data: {
                    stats,
                    recentMessages,
                },
            });
        } catch (error: any) {
            console.error('WhatsApp stats error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch WhatsApp statistics',
            });
        }
    },

    /**
     * POST /api/admin/whatsapp/test
     * Send test WhatsApp message
     */
    async sendTestMessage(req: AuthRequest, res: Response) {
        try {
            const { to, message } = req.body;

            if (!to || !message) {
                return res.status(400).json({
                    success: false,
                    error: 'Phone number and message required',
                });
            }

            const result = await whatsappService.sendMessage({
                to,
                body: message,
            });

            return res.json({
                success: result.success,
                messageSid: result.messageSid,
                status: result.status,
                error: result.error,
            });
        } catch (error: any) {
            console.error('Test WhatsApp error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send test message',
            });
        }
    },

    /**
     * GET /api/admin/whatsapp/messages
     * Get message logs with pagination
     */
    async getMessages(req: AuthRequest, res: Response) {
        try {
            const { page = '1', limit = '50', status, phone } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {};
            if (status) where.status = status;
            if (phone) where.to_phone = { contains: String(phone) };

            const [messages, total] = await Promise.all([
                (prisma as any).whatsapp_messages.findMany({
                    where,
                    orderBy: { sent_at: 'desc' },
                    skip,
                    take: Number(limit),
                    select: {
                        id: true,
                        to_phone: true,
                        body: true,
                        status: true,
                        template_name: true,
                        message_sid: true,
                        sent_at: true,
                        delivered_at: true,
                        read_at: true,
                        failed_at: true,
                        error_message: true,
                    },
                }),
                (prisma as any).whatsapp_messages.count({ where }),
            ]);

            return res.json({
                success: true,
                data: {
                    messages,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit)),
                    },
                },
            });
        } catch (error: any) {
            console.error('Get messages error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch messages',
            });
        }
    },

    /**
     * POST /api/webhooks/whatsapp
     * Handle Twilio WhatsApp webhooks
     */
    async handleWebhook(req: AuthRequest, res: Response) {
        try {
            const {
                MessageSid,
                MessageStatus,
                ErrorCode,
                ErrorMessage,
                To,
                From,
                Body,
            } = req.body;

            console.log(`📲 WhatsApp webhook: ${MessageSid} - ${MessageStatus}`);

            // Update message status
            await whatsappService.updateMessageStatus(MessageSid, MessageStatus);

            // Log webhook event
            await (prisma as any).whatsapp_webhook_events.create({
                data: {
                    id: require('crypto').randomBytes(8).toString('hex'),
                    message_sid: MessageSid,
                    event_type: MessageStatus,
                    status: MessageStatus,
                    error_code: ErrorCode,
                    error_message: ErrorMessage,
                    raw_payload: req.body,
                    received_at: new Date(),
                },
            });

            // Handle user replies (for future chatbot integration)
            if (MessageStatus === 'received' && Body) {
                console.log(`💬 User reply from ${From}: ${Body}`);
                // TODO: Add chatbot logic here
            }

            return res.status(200).send('OK');
        } catch (error: any) {
            console.error('Webhook error:', error);
            return res.status(500).json({
                success: false,
                error: 'Webhook processing failed',
            });
        }
    },
};

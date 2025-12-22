import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { multiEmailService } from '../services/multiProviderEmailService';
import { prisma } from '../config/database';

/**
 * GOD-LEVEL EMAIL ADMIN CONTROLLER
 * Statistics and monitoring endpoints
 */
export const emailAdminController = {
    /**
     * GET /api/admin/email-stats
     * Get email provider statistics
     */
    async getStats(req: AuthRequest, res: Response) {
        try {
            const stats = multiEmailService.getStats();
            const totalStats = multiEmailService.getTotalStats();

            // Get recent email logs (last 100)
            const recentLogs = await (prisma as any).email_logs.findMany({
                orderBy: { sent_at: 'desc' },
                take: 100,
                select: {
                    id: true,
                    to_email: true,
                    subject: true,
                    provider: true,
                    status: true,
                    sent_at: true,
                },
            });

            // Get delivery stats by provider
            const deliveryStats = await (prisma as any).email_logs.groupBy({
                by: ['provider', 'status'],
                _count: true,
            });

            return res.json({
                success: true,
                data: {
                    totalStats,
                    providers: stats,
                    recentLogs,
                    deliveryStats,
                },
            });
        } catch (error: any) {
            console.error('Email stats error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch email statistics',
            });
        }
    },

    /**
     * GET /api/admin/email-monthly-usage
     * Get monthly usage per provider
     */
    async getMonthlyUsage(req: AuthRequest, res: Response) {
        try {
            const { month } = req.query;
            const targetMonth = month as string || new Date().toISOString().substring(0, 7);

            const monthlyStats = await (prisma as any).email_provider_stats.findMany({
                where: { month: targetMonth },
                orderBy: { provider: 'asc' },
            });

            return res.json({
                success: true,
                data: {
                    month: targetMonth,
                    stats: monthlyStats,
                },
            });
        } catch (error: any) {
            console.error('Monthly usage error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch monthly usage',
            });
        }
    },

    /**
     * POST /api/admin/email-test
     * Send test email
     */
    async sendTestEmail(req: AuthRequest, res: Response) {
        try {
            const { to } = req.body;

            if (!to) {
                return res.status(400).json({
                    success: false,
                    error: 'Email address required',
                });
            }

            const result = await multiEmailService.send({
                to,
                subject: 'Test Email from StudyVault',
                html: '<h1>Test Email</h1><p>This is a test email from the multi-provider system.</p>',
                text: 'Test Email - This is a test email from the multi-provider system.',
            });

            return res.json({
                success: result.success,
                provider: result.provider,
                messageId: result.messageId,
                error: result.error,
            });
        } catch (error: any) {
            console.error('Test email error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send test email',
            });
        }
    },
};

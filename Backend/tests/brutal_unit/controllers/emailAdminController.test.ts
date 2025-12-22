import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockMultiEmailService = {
    getStats: jest.fn() as any,
    getTotalStats: jest.fn() as any,
    send: jest.fn() as any,
};

const mockPrisma = {
    email_logs: {
        findMany: jest.fn() as any,
        groupBy: jest.fn() as any,
    },
    email_provider_stats: {
        findMany: jest.fn() as any,
    },
};

jest.mock('../../../src/services/multiProviderEmailService', () => ({
    __esModule: true,
    multiEmailService: mockMultiEmailService
}));

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { emailAdminController } from '../../../src/controllers/emailAdminController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('EmailAdminController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, body?: any, query?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'admin_123' } as any, body: {}, query: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('getStats', () => {
        it('should return email statistics', async () => {
            (mockMultiEmailService.getStats as any).mockReturnValue({
                ses: { sent: 100, failed: 2 }
            });
            (mockMultiEmailService.getTotalStats as any).mockReturnValue({
                totalSent: 100,
                totalFailed: 2
            });
            (mockPrisma.email_logs.findMany as any).mockResolvedValue([]);
            (mockPrisma.email_logs.groupBy as any).mockResolvedValue([]);

            await emailAdminController.getStats(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    totalStats: expect.any(Object),
                    providers: expect.any(Object)
                })
            }));
        });

        it('should handle errors', async () => {
            (mockMultiEmailService.getStats as any).mockImplementation(() => {
                throw new Error('Service error');
            });

            await emailAdminController.getStats(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('getMonthlyUsage', () => {
        it('should return monthly usage', async () => {
            req.query = { month: '2025-01' };

            (mockPrisma.email_provider_stats.findMany as any).mockResolvedValue([
                { provider: 'ses', month: '2025-01', sent: 100 }
            ]);

            await emailAdminController.getMonthlyUsage(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    month: '2025-01'
                })
            }));
        });
    });

    describe('sendTestEmail', () => {
        it('should send test email', async () => {
            req.body = { to: 'test@example.com' };

            (mockMultiEmailService.send as any).mockResolvedValue({
                success: true,
                provider: 'ses',
                messageId: 'msg_123'
            });

            await emailAdminController.sendTestEmail(req as any, res as Response);

            expect(mockMultiEmailService.send).toHaveBeenCalled();
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                provider: 'ses'
            }));
        });

        it('should return 400 if to missing', async () => {
            req.body = {};

            await emailAdminController.sendTestEmail(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });
});

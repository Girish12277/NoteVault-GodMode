import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockWhatsappService = {
    getStats: jest.fn() as any,
    sendMessage: jest.fn() as any,
    updateMessageStatus: jest.fn() as any,
};

const mockPrisma = {
    whatsapp_messages: {
        findMany: jest.fn() as any,
        count: jest.fn() as any,
    },
    whatsapp_webhook_events: {
        create: jest.fn() as any,
    },
};

jest.mock('../../../src/services/whatsappService', () => ({
    __esModule: true,
    whatsappService: mockWhatsappService
}));

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

jest.mock('crypto', () => ({
    randomBytes: jest.fn(() => ({ toString: () => 'random_id' }))
}));

// Import Controller
import { whatsappController } from '../../../src/controllers/whatsappController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('WhatsappController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, body?: any, params?: any, query?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let sendMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        sendMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });

        req = { user: { id: 'admin_123' } as any, body: {}, params: {}, query: {} };
        res = { status: statusMock as any, json: jsonMock as any, send: sendMock as any };
    });

    describe('getStats', () => {
        it('should return WhatsApp statistics', async () => {
            (mockWhatsappService.getStats as any).mockResolvedValue({
                totalSent: 100,
                delivered: 95,
                failed: 5
            });
            (mockPrisma.whatsapp_messages.findMany as any).mockResolvedValue([
                { id: 'msg_1', status: 'delivered' }
            ]);

            await whatsappController.getStats(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    stats: expect.any(Object),
                    recentMessages: expect.any(Array)
                })
            }));
        });

        it('should return 500 if stats fetch fails', async () => {
            (mockWhatsappService.getStats as any).mockResolvedValue(null);

            await whatsappController.getStats(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('sendTestMessage', () => {
        it('should send test message', async () => {
            req.body = { to: '+1234567890', message: 'Test' };

            (mockWhatsappService.sendMessage as any).mockResolvedValue({
                success: true,
                messageSid: 'SM123',
                status: 'queued'
            });

            await whatsappController.sendTestMessage(req as any, res as Response);

            expect(mockWhatsappService.sendMessage).toHaveBeenCalledWith({
                to: '+1234567890',
                body: 'Test'
            });
        });

        it('should return 400 if to missing', async () => {
            req.body = { message: 'Test' };

            await whatsappController.sendTestMessage(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    describe('getMessages', () => {
        it('should return paginated messages', async () => {
            req.query = { page: '1', limit: '10' };

            (mockPrisma.whatsapp_messages.findMany as any).mockResolvedValue([]);
            (mockPrisma.whatsapp_messages.count as any).mockResolvedValue(0);

            await whatsappController.getMessages(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    pagination: expect.any(Object)
                })
            }));
        });
    });

    describe('handleWebhook', () => {
        it('should handle webhook event', async () => {
            req.body = {
                MessageSid: 'SM123',
                MessageStatus: 'delivered'
            };

            (mockWhatsappService.updateMessageStatus as any).mockResolvedValue({});
            (mockPrisma.whatsapp_webhook_events.create as any).mockResolvedValue({});

            await whatsappController.handleWebhook(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(200);
            expect(sendMock).toHaveBeenCalledWith('OK');
        });
    });
});

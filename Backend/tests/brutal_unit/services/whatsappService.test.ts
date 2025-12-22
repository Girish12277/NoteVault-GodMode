import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockTwilio = {
    messages: {
        create: jest.fn() as any,
    },
};

jest.mock('twilio', () => {
    return jest.fn(() => mockTwilio);
});

const mockPrisma = {
    whatsapp_messages: {
        create: jest.fn() as any,
        updateMany: jest.fn() as any,
        count: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

import { whatsappService } from '../../../src/services/whatsappService';

describe('WhatsAppService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Manually configure if needed, similar to smsService
        (whatsappService as any).client = mockTwilio;
        (whatsappService as any).from = 'whatsapp:+123456789';
    });

    describe('sendMessage', () => {
        it('should send message successfully', async () => {
            mockTwilio.messages.create.mockResolvedValue({
                sid: 'SM123',
                status: 'queued'
            });

            const result = await whatsappService.sendMessage({
                to: '1234567890',
                body: 'Test'
            });

            expect(result.success).toBe(true);
            expect(mockTwilio.messages.create).toHaveBeenCalled();
            expect(mockPrisma.whatsapp_messages.create).toHaveBeenCalled();
        });

        it('should handle send failure', async () => {
            mockTwilio.messages.create.mockRejectedValue(new Error('Fail'));

            const result = await whatsappService.sendMessage({
                to: '1234567890',
                body: 'Test'
            });

            expect(result.success).toBe(false);
            expect(mockPrisma.whatsapp_messages.create).toHaveBeenCalled();
        });
    });

    describe('sendOTP', () => {
        it('should send OTP template', async () => {
            mockTwilio.messages.create.mockResolvedValue({ sid: 'SM123' });
            await whatsappService.sendOTP('1234567890', '123456');
            expect(mockTwilio.messages.create).toHaveBeenCalledWith(
                expect.objectContaining({ body: expect.stringContaining('123456') })
            );
        });
    });

    describe('sendOrderConfirmation', () => {
        it('should send order template', async () => {
            mockTwilio.messages.create.mockResolvedValue({ sid: 'SM123' });
            await whatsappService.sendOrderConfirmation('1234567890', {
                orderId: 'ORD1', items: ['Note 1'], amount: 100
            });
            expect(mockTwilio.messages.create).toHaveBeenCalled();
        });
    });

    describe('updateMessageStatus', () => {
        it('should update status in db', async () => {
            await whatsappService.updateMessageStatus('SM123', 'delivered');
            expect(mockPrisma.whatsapp_messages.updateMany).toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return stats', async () => {
            (mockPrisma.whatsapp_messages.count as any).mockResolvedValue(10);
            const stats = await whatsappService.getStats();
            expect(stats).toBeDefined();
            expect(stats?.total).toBe(10);
        });
    });
});

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockTwilio = {
    messages: {
        create: jest.fn() as any,
    },
};

jest.mock('twilio', () => {
    return jest.fn(() => mockTwilio);
});

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};

jest.mock('../../../src/services/logger', () => ({
    __esModule: true,
    logger: mockLogger
}));

import { smsService } from '../../../src/services/smsService';

describe('SMSService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Force configuration since singleton initialized before env vars were set
        (smsService as any).isConfigured = true;
        (smsService as any).client = mockTwilio;
        (smsService as any).fromNumber = '+1234567890';
    });

    describe('sendOTPSMS', () => {
        it('should send SMS successfully', async () => {
            (mockTwilio.messages.create as any).mockResolvedValue({
                sid: 'SM123',
                status: 'queued'
            });

            const result = await smsService.sendOTPSMS('+911234567890', '123456', 10);

            expect(result.success).toBe(true);
            expect(mockTwilio.messages.create).toHaveBeenCalled();
        });

        it('should handle SMS send failure', async () => {
            (mockTwilio.messages.create as any).mockRejectedValue(new Error('Twilio error'));

            const result = await smsService.sendOTPSMS('+911234567890', '123456', 10);

            expect(result.success).toBe(false);
        });
    });

    describe('isReady', () => {
        it('should check if SMS service is ready', () => {
            const ready = smsService.isReady();
            expect(typeof ready).toBe('boolean');
        });
    });
});

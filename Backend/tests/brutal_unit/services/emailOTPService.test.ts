import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockPrisma = {
    email_otps: {
        count: jest.fn() as any,
        create: jest.fn() as any,
        updateMany: jest.fn() as any,
        findFirst: jest.fn() as any,
        update: jest.fn() as any,
        deleteMany: jest.fn() as any,
    },
    users: {
        update: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

const mockMultiEmailService = {
    send: jest.fn() as any,
};

jest.mock('../../../src/services/multiProviderEmailService', () => ({
    __esModule: true,
    multiEmailService: mockMultiEmailService
}));

import { emailOTPService } from '../../../src/services/emailOTPService';

describe('EmailOTPService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateEmailOTP', () => {
        it('should generate OTP successfully', async () => {
            (mockPrisma.email_otps.count as any).mockResolvedValue(0);
            (mockPrisma.email_otps.updateMany as any).mockResolvedValue({});
            (mockPrisma.email_otps.create as any).mockResolvedValue({});

            const result = await emailOTPService.generateEmailOTP('test@example.com', 'user_123');

            expect(result.success).toBe(true);
            expect(mockPrisma.email_otps.create).toHaveBeenCalled();
        });

        it('should enforce rate limiting', async () => {
            (mockPrisma.email_otps.count as any).mockResolvedValue(3);

            const result = await emailOTPService.generateEmailOTP('test@example.com');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many OTP requests');
        });
    });

    describe('verifyEmailOTP', () => {
        it('should return error for expired OTP', async () => {
            (mockPrisma.email_otps.findFirst as any).mockResolvedValue(null);

            const result = await emailOTPService.verifyEmailOTP('test@example.com', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid or expired');
        });

        it('should enforce max attempts', async () => {
            (mockPrisma.email_otps.findFirst as any).mockResolvedValue({
                id: 'otp_1',
                attempts: 3,
                otp_hash: 'hash'
            });

            const result = await emailOTPService.verifyEmailOTP('test@example.com', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum verification attempts exceeded');
        });
    });

    describe('cleanupExpiredOTPs', () => {
        it('should cleanup expired OTPs', async () => {
            (mockPrisma.email_otps.deleteMany as any).mockResolvedValue({ count: 5 });

            const result = await emailOTPService.cleanupExpiredOTPs();

            expect(result.deleted).toBe(5);
            expect(mockPrisma.email_otps.deleteMany).toHaveBeenCalled();
        });
    });
});

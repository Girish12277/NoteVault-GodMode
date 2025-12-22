import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockPrisma = {
    mobile_otps: {
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

const mockSmsService = {
    sendOTPSMS: jest.fn() as any,
    isReady: jest.fn() as any,
};

jest.mock('../../../src/services/smsService', () => ({
    __esModule: true,
    smsService: mockSmsService
}));

import { mobileOTPService } from '../../../src/services/mobileOTPService';

describe('MobileOTPService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateMobileOTP', () => {
        it('should generate OTP successfully', async () => {
            (mockPrisma.mobile_otps.count as any).mockResolvedValue(0);
            (mockPrisma.mobile_otps.updateMany as any).mockResolvedValue({});
            (mockPrisma.mobile_otps.create as any).mockResolvedValue({});
            (mockSmsService.sendOTPSMS as any).mockResolvedValue({ success: true });

            const result = await mobileOTPService.generateMobileOTP('+911234567890', 'user_123');

            expect(result.success).toBe(true);
            expect(mockPrisma.mobile_otps.create).toHaveBeenCalled();
            expect(mockSmsService.sendOTPSMS).toHaveBeenCalled();
        });

        it('should return error for invalid phone', async () => {
            const result = await mobileOTPService.generateMobileOTP('invalid-phone', 'user_123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid phone');
        });

        it('should enforce rate limiting', async () => {
            (mockPrisma.mobile_otps.count as any).mockResolvedValue(3);

            const result = await mobileOTPService.generateMobileOTP('+911234567890');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Too many OTP requests');
        });
    });

    describe('verifyMobileOTP', () => {
        it('should return error for expired OTP', async () => {
            (mockPrisma.mobile_otps.findFirst as any).mockResolvedValue(null);

            const result = await mobileOTPService.verifyMobileOTP('+911234567890', '123456');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid or expired');
        });
    });

    describe('cleanupExpiredOTPs', () => {
        it('should cleanup expired OTPs', async () => {
            (mockPrisma.mobile_otps.deleteMany as any).mockResolvedValue({ count: 5 });

            const result = await mobileOTPService.cleanupExpiredOTPs();

            expect(result.deleted).toBe(5);
        });
    });
});

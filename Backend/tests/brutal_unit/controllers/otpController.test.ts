import { jest, describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import { Request, Response } from 'express';
import crypto from 'crypto';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockEmailOTPService = {
    generateAndSendOTP: jest.fn(),
    verifyEmailOTP: jest.fn(),
    resendEmailOTP: jest.fn(),
};

const mockMobileOTPService = {
    generateMobileOTP: jest.fn(),
    verifyMobileOTP: jest.fn(),
    resendMobileOTP: jest.fn(),
};

const mockPrisma = {
    users: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    device_sessions: {
        create: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrisma)),
};

jest.mock('../../../src/services/emailOTPService', () => ({
    __esModule: true,
    emailOTPService: mockEmailOTPService
}));

jest.mock('../../../src/services/mobileOTPService', () => ({
    __esModule: true,
    mobileOTPService: mockMobileOTPService
}));

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller AFTER mocks
import { otpController } from '../../../src/controllers/otpController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('OTP Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { headers: Record<string, string> };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeAll(() => {
        process.env.JWT_SECRET = 'test_secret';
    });

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        req = {
            method: 'POST',
            ip: '127.0.0.1',
            headers: {},
            body: {}
        };
        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
    });

    // ------------------------------------------------------------------
    // EMAIL OTP
    // ------------------------------------------------------------------
    describe('Email OTP', () => {
        it('should send email OTP successfully', async () => {
            req.body = { email: 'test@example.com' };
            (mockEmailOTPService.generateAndSendOTP as any).mockResolvedValue({ success: true, message: 'OTP Sent', attemptsRemaining: 3 });

            await otpController.sendEmailOTP(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should handle rate limiting (429) on send', async () => {
            req.body = { email: 'test@example.com' };
            (mockEmailOTPService.generateAndSendOTP as any).mockResolvedValue({ success: false, error: 'Too many requests' });

            await otpController.sendEmailOTP(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(429);
        });

        it('should verify valid OTP', async () => {
            req.body = { email: 'test@example.com', otp: '123456' };
            (mockEmailOTPService.verifyEmailOTP as any).mockResolvedValue({ success: true, message: 'Verified', userId: 'user_1' });

            await otpController.verifyEmailOTP(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true, userId: 'user_1' }));
        });

        it('should reject invalid format OTP', async () => {
            req.body = { email: 'test@example.com', otp: 'short' }; // < 6 digits

            await otpController.verifyEmailOTP(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400); // Zod validation
        });
    });

    // ------------------------------------------------------------------
    // MOBILE OTP
    // ------------------------------------------------------------------
    describe('Mobile OTP', () => {
        it('should send mobile OTP successfully', async () => {
            req.body = { phone: '9876543210' };
            (mockMobileOTPService.generateMobileOTP as any).mockResolvedValue({ success: true, message: 'SMS Sent', attemptsRemaining: 3 });

            await otpController.sendMobileOTP(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should handle invalid phone format', async () => {
            req.body = { phone: '123' }; // Too short

            await otpController.sendMobileOTP(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    // ------------------------------------------------------------------
    // PHONE REGISTRATION (Tier 0 Critical)
    // ------------------------------------------------------------------
    describe('Register with Phone', () => {
        const regData = {
            phone: '9876543210',
            otp: '123456',
            name: 'Test Student',
            degree: 'B.Tech',
            universityId: 'uni_1',
            collegeName: 'IIT',
            currentSemester: 5
        };

        it('should register new user if OTP is valid', async () => {
            req.body = regData;

            // 1. Verify OTP
            (mockMobileOTPService.verifyMobileOTP as any).mockResolvedValue({ success: true, formattedPhone: '919876543210' });

            // 2. Check Exists (No)
            (mockPrisma.users.findUnique as any).mockResolvedValue(null);

            // 3. Create User
            (mockPrisma.users.create as any).mockResolvedValue({
                id: 'user_1',
                phone: '919876543210',
                full_name: 'Test Student'
            });

            await otpController.registerWithPhone(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ accessToken: expect.any(String) })
            }));
            // Verify session creation
            expect(mockPrisma.device_sessions.create).toHaveBeenCalled();
        });

        it('should reject if OTP is invalid', async () => {
            req.body = regData;
            (mockMobileOTPService.verifyMobileOTP as any).mockResolvedValue({ success: false, error: 'Invalid OTP' });

            await otpController.registerWithPhone(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid OTP' }));
        });

        it('should reject if phone already registered', async () => {
            req.body = regData;
            (mockMobileOTPService.verifyMobileOTP as any).mockResolvedValue({ success: true, formattedPhone: '919876543210' });
            (mockPrisma.users.findUnique as any).mockResolvedValue({ id: 'existing_User' });

            await otpController.registerWithPhone(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
        });
    });

    // ------------------------------------------------------------------
    // PHONE LOGIN
    // ------------------------------------------------------------------
    describe('Login with Phone', () => {
        it('should login existing active user', async () => {
            req.body = { phone: '9876543210', otp: '123456' };

            (mockMobileOTPService.verifyMobileOTP as any).mockResolvedValue({ success: true, formattedPhone: '919876543210' });
            (mockPrisma.users.findUnique as any).mockResolvedValue({
                id: 'user_1',
                phone: '919876543210',
                is_active: true
            });

            await otpController.loginWithPhone(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Login successful'
            }));
        });

        it('should reject suspended user', async () => {
            req.body = { phone: '9876543210', otp: '123456' };

            (mockMobileOTPService.verifyMobileOTP as any).mockResolvedValue({ success: true, formattedPhone: '919876543210' });
            (mockPrisma.users.findUnique as any).mockResolvedValue({
                id: 'user_1',
                phone: '919876543210',
                is_active: false // Suspended
            });

            await otpController.loginWithPhone(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('suspended') }));
        });

        it('should reject unregistered number during login', async () => {
            req.body = { phone: '9876543210', otp: '123456' };

            (mockMobileOTPService.verifyMobileOTP as any).mockResolvedValue({ success: true, formattedPhone: '919876543210' });
            (mockPrisma.users.findUnique as any).mockResolvedValue(null); // Not found

            await otpController.loginWithPhone(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });
});

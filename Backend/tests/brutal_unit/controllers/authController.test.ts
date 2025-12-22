import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { Request, Response } from 'express';

// Define Mocks BEFORE imports that use them (or let hoisting handle it, but inline the object)
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/services/emailService');
jest.mock('../../../src/services/alertService');

jest.mock('../../../src/config/database', () => ({
    prisma: {
        users: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            findFirst: jest.fn(),
        },
        device_sessions: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
            updateMany: jest.fn(),
        },
        seller_wallets: {
            create: jest.fn(),
        },
        $transaction: jest.fn((callback: any) => callback({
            users: {
                create: jest.fn(),
                findUnique: jest.fn(),
                update: jest.fn(),
                findFirst: jest.fn(),
            },
            // Add other transaction-used models if needed
        })),
    }
}));

// Now Imports
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authController } from '../../../src/controllers/authController';
import { prisma } from '../../../src/config/database';
import emailService from '../../../src/services/emailService';
import { alertService } from '../../../src/services/alertService';


const mockPrisma = prisma as any;

describe('Auth Controller Brutal Tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset Env
        process.env.JWT_SECRET = 'test_secret';

        // Mock Express Req/Res
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        req = {
            body: {},
            headers: {},
            ip: '127.0.0.1'
        };
        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
    });

    describe('register', () => {
        const mockUser = {
            id: 'u1',
            email: 'test@example.com',
            full_name: 'Test User',
            is_active: true,
            created_at: new Date(),
        };

        it('should register a new user successfully', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password123',
                name: 'Test User',
                universityId: 'univ_1',
                collegeName: 'College',
                currentSemester: 1
            };

            (bcrypt.hash as any).mockResolvedValue('hashed_pw');
            mockPrisma.users.create.mockResolvedValue(mockUser);
            mockPrisma.device_sessions.create.mockResolvedValue({});
            (jwt.sign as jest.Mock).mockReturnValue('token');
            (emailService.sendWelcomeEmail as any).mockResolvedValue(true);

            await authController.register(req as Request, res as Response);

            expect(mockPrisma.users.create).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(201);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
        });

        it('should handle concurrent email registration (Race Condition)', async () => {
            req.body = { email: 'exists@example.com', password: 'pw', name: 'name' };
            (bcrypt.hash as any).mockResolvedValue('hash');

            // Simulate P2002 Unique Constraint Error
            const error: any = new Error('Unique constraint');
            error.code = 'P2002';
            mockPrisma.users.create.mockRejectedValue(error);

            await authController.register(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'EMAIL_EXISTS' }));
            expect(alertService.warning).toHaveBeenCalled();
        });

        it('should handle general database errors', async () => {
            req.body = { email: 'fail@example.com' };
            mockPrisma.users.create.mockRejectedValue(new Error('DB Boom'));

            await authController.register(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'REGISTRATION_ERROR' }));
        });
    });

    describe('login', () => {
        it('should login successfully with valid credentials', async () => {
            req.body = { email: 'valid@example.com', password: 'password' };
            const user = {
                id: 'u1',
                email: 'valid@example.com',
                password_hash: 'hash',
                is_active: true,
                failed_login_attempts: 0,
                lockout_until: null
            };

            mockPrisma.users.findUnique.mockResolvedValue(user);
            (bcrypt.compare as any).mockResolvedValue(true);
            mockPrisma.users.update.mockResolvedValue(user); // Reset counters
            mockPrisma.device_sessions.create.mockResolvedValue({});
            (jwt.sign as jest.Mock).mockReturnValue('token');

            await authController.login(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(mockPrisma.users.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ failed_login_attempts: 0 })
            }));
        });

        it('should handle invalid credentials', async () => {
            req.body = { email: 'user@example.com', password: 'wrong' };
            const user = {
                id: 'u1',
                email: 'user@example.com',
                password_hash: 'hash',
                failed_login_attempts: 0
            };

            mockPrisma.users.findUnique.mockResolvedValue(user);
            (bcrypt.compare as any).mockResolvedValue(false);
            mockPrisma.users.update.mockResolvedValue({}); // Increment attempts

            await authController.login(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'INVALID_CREDENTIALS' }));
            // Should increment attempts
            expect(mockPrisma.users.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: expect.objectContaining({ failed_login_attempts: 1 }) })
            );
        });

        it('should block account after 5 failed attempts (Lockout)', async () => {
            req.body = { email: 'user@example.com', password: 'wrong' };
            const user = {
                id: 'u1',
                email: 'user@example.com',
                password_hash: 'hash',
                failed_login_attempts: 4, // 4 already
            };

            mockPrisma.users.findUnique.mockResolvedValue(user);
            (bcrypt.compare as any).mockResolvedValue(false);
            mockPrisma.users.update.mockResolvedValue({});

            await authController.login(req as Request, res as Response);

            // Attempts becomes 5 -> Lockout
            expect(statusMock).toHaveBeenCalledWith(429);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'ACCOUNT_LOCKED' }));
            expect(mockPrisma.users.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        failed_login_attempts: 5,
                        lockout_until: expect.anything()
                    })
                })
            );
        });

        it('should reject login if account is locked', async () => {
            req.body = { email: 'locked@example.com', password: 'any' };
            const lockedUntil = new Date(Date.now() + 100000); // Future

            mockPrisma.users.findUnique.mockResolvedValue({
                id: 'u1',
                lockout_until: lockedUntil
            });

            await authController.login(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(429);
            expect(alertService.high).toHaveBeenCalled(); // Should trigger high alert
        });
    });

    describe('refreshToken', () => {
        it('should refresh token and rotate it', async () => {
            req.body = { refreshToken: 'valid_refresh' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', sessionId: 's1', type: 'refresh' });

            mockPrisma.device_sessions.findUnique.mockResolvedValue({ id: 's1', is_revoked: false });
            mockPrisma.device_sessions.update.mockResolvedValue({});
            mockPrisma.users.findUnique.mockResolvedValue({ id: 'u1', is_active: true });

            (jwt.sign as jest.Mock).mockReturnValue('new_token');

            await authController.refreshToken(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
            expect(mockPrisma.device_sessions.update).toHaveBeenCalled(); // Last seen update
        });

        it('should reject revoked sessions', async () => {
            req.body = { refreshToken: 'revoked' };
            (jwt.verify as jest.Mock).mockReturnValue({ userId: 'u1', sessionId: 's1', type: 'refresh' });

            mockPrisma.device_sessions.findUnique.mockResolvedValue({ id: 's1', is_revoked: true });

            await authController.refreshToken(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ code: 'SESSION_REVOKED' }));
        });
    });

    describe('getMe', () => {
        it('should return user profile', async () => {
            (req as any).user = { id: 'u1' };
            mockPrisma.users.findUnique.mockResolvedValue({
                id: 'u1',
                full_name: 'Me',
                is_seller: false,
                is_admin: false,
                universities: [],
                _count: { notes: 5 }
            });

            await authController.getMe(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({ stats: expect.objectContaining({ notesCreated: 5 }) })
            }));
        });
    });

    describe('becomeSeller', () => {
        it('should upgrade user to seller', async () => {
            (req as any).user = { id: 'u1' };
            mockPrisma.users.findUnique.mockResolvedValue({ is_seller: false });
            mockPrisma.users.update.mockResolvedValue({});
            mockPrisma.seller_wallets.create.mockResolvedValue({});

            await authController.becomeSeller(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Congratulations') }));
            expect(mockPrisma.users.update).toHaveBeenCalledWith(expect.objectContaining({ data: { is_seller: true } }));
            expect(mockPrisma.seller_wallets.create).toHaveBeenCalled();
        });
    });
});

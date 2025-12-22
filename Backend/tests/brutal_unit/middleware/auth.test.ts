import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const mockPrisma = {
    users: {
        findUnique: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

import { authenticate, requireSeller } from '../../../src/middleware/auth';

describe('Auth Middleware - Brutal Unit Tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        next = jest.fn();

        req = { headers: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('authenticate', () => {
        it('should return 401 if no token', async () => {
            await authenticate(req as Request, res as Response, next);
            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ message: 'Authentication required' }));
        });

        it('should return 401 if invalid token', async () => {
            req.headers = { authorization: 'Bearer invalid' };
            jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('Invalid'); });

            await authenticate(req as Request, res as Response, next);
            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user not found', async () => {
            req.headers = { authorization: 'Bearer valid' };
            jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'u1' } as any);
            (mockPrisma.users.findUnique as any).mockResolvedValue(null);

            await authenticate(req as Request, res as Response, next);
            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('should return 401 if user inactive', async () => {
            req.headers = { authorization: 'Bearer valid' };
            jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'u1' } as any);
            (mockPrisma.users.findUnique as any).mockResolvedValue({ id: 'u1', is_active: false });

            await authenticate(req as Request, res as Response, next);
            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('should call next if valid', async () => {
            req.headers = { authorization: 'Bearer valid' };
            jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'u1' } as any);
            (mockPrisma.users.findUnique as any).mockResolvedValue({
                id: 'u1',
                email: 't@t.com',
                full_name: 'Test',
                is_seller: false,
                is_admin: false,
                is_active: true
            });

            await authenticate(req as Request, res as Response, next);
            expect(next).toHaveBeenCalled();
            expect((req as any).user).toBeDefined();
        });
    });

    describe('requireSeller', () => {
        it('should allow seller', () => {
            req = { user: { isSeller: true } } as any;
            requireSeller(req as any, res as Response, next);
            expect(next).toHaveBeenCalled();
        });

        it('should allow admin', () => {
            req = { user: { isAdmin: true } } as any;
            requireSeller(req as any, res as Response, next);
            expect(next).toHaveBeenCalled();
        });

        it('should deny non-seller', () => {
            req = { user: { isSeller: false, isAdmin: false } } as any;
            requireSeller(req as any, res as Response, next);
            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });
});

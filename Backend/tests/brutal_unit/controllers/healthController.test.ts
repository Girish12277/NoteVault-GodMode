// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------

// Mock Alert Service
jest.mock('../../../src/services/alertService', () => ({
    alertService: {
        getDLQStats: jest.fn()
    }
}));

// Mock Prisma
const mockPrisma = {
    $queryRaw: jest.fn()
};

jest.mock('../../../src/config/database', () => ({
    prisma: mockPrisma
}));

// ------------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------------
import { healthController } from '../../../src/controllers/healthController';
import { alertService } from '../../../src/services/alertService';
import { prisma } from '../../../src/config/database';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Health Controller - Brutal Unit Tests', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
            json: jest.fn()
        };

        // Mock Env
        process.env.DATABASE_URL = 'postgres://mock';
        process.env.JWT_SECRET = 'secret';
    });

    describe('basic', () => {
        it('should return basic health info', async () => {
            await healthController.basic(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'ok',
                uptime: expect.any(Number)
            }));
        });
    });

    describe('kubernetes', () => {
        it('should return 200 OK if DB is healthy', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
            await healthController.kubernetes(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith('OK');
        });

        it('should return 503 if DB fails', async () => {
            (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB Fail'));
            await healthController.kubernetes(req, res);
            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.send).toHaveBeenCalledWith('Service Unavailable');
        });
    });

    describe('detailed', () => {
        it('should return healthy status when all checks pass', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
            (alertService.getDLQStats as jest.Mock).mockResolvedValue({
                failedCount: 0,
                deliveredCount: 100,
                averageAttempts: 1
            });

            // Ensure env vars are set
            process.env.RAZORPAY_KEY_ID = 'key';
            process.env.RAZORPAY_KEY_SECRET = 'secret';
            process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
            process.env.CLOUDINARY_API_KEY = 'apikey';
            process.env.CLOUDINARY_API_SECRET = 'apisecret';

            await healthController.detailed(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'healthy',
                checks: expect.objectContaining({
                    database: expect.objectContaining({ status: 'healthy' }),
                    alertDLQ: expect.objectContaining({ status: 'healthy' })
                })
            }));
        });

        it('should return broken/unhealthy if DB fails', async () => {
            (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('DB Fail'));
            await healthController.detailed(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'unhealthy',
                checks: expect.objectContaining({
                    database: expect.objectContaining({ status: 'unhealthy' })
                })
            }));
        });

        it('should return degraded if env vars missing', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
            (alertService.getDLQStats as jest.Mock).mockResolvedValue({});

            // Unset critical env var
            delete process.env.CLOUDINARY_API_KEY;

            await healthController.detailed(req, res);

            expect(res.status).toHaveBeenCalledWith(200); // 200 but degraded
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                status: 'degraded',
                checks: expect.objectContaining({
                    configuration: expect.objectContaining({ status: 'degraded' })
                })
            }));
        });
    });

    describe('ready', () => {
        it('should return 200 if ready', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
            process.env.DATABASE_URL = 'yes';
            process.env.JWT_SECRET = 'yes';

            await healthController.ready(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ready' }));
        });

        it('should return 503 if not ready (env missing)', async () => {
            (prisma.$queryRaw as jest.Mock).mockResolvedValue([1]);
            delete process.env.JWT_SECRET;

            await healthController.ready(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'not_ready' }));
        });

        it('should return 503 if DB fails', async () => {
            (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Fail'));
            await healthController.ready(req, res);
            expect(res.status).toHaveBeenCalledWith(503);
        });
    });

    describe('live', () => {
        it('should always return 200', async () => {
            await healthController.live(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'alive' }));
        });
    });
});

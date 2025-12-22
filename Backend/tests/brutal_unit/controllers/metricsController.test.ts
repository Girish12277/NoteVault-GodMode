import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockAlertService = {
    getDLQStats: jest.fn() as any,
};

const mockCacheService = {
    getStats: jest.fn() as any,
};

jest.mock('../../../src/services/alertService', () => ({
    __esModule: true,
    alertService: mockAlertService
}));

jest.mock('../../../src/services/cacheService', () => ({
    __esModule: true,
    cacheService: mockCacheService
}));

// Import Controller
import { metricsController } from '../../../src/controllers/metricsController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('MetricsController - Brutal Unit Tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let sendMock: jest.Mock;
    let setMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        sendMock = jest.fn();
        setMock = jest.fn();

        req = {};
        res = {
            json: jsonMock as any,
            send: sendMock as any,
            set: setMock as any,
            status: jest.fn().mockReturnThis() as any
        };

        (mockAlertService.getDLQStats as any).mockResolvedValue({
            failedCount: 5,
            deliveredCount: 95,
            averageAttempts: 1.2
        });

        (mockCacheService.getStats as any).mockReturnValue({
            hits: 1000,
            misses: 50,
            errors: 2,
            hitRate: 95.2,
            isAvailable: true
        });
    });

    describe('prometheus', () => {
        it('should return Prometheus format metrics', async () => {
            await metricsController.prometheus(req as Request, res as Response);

            expect(setMock).toHaveBeenCalledWith('Content-Type', 'text/plain; version=0.0.4');
            expect(sendMock).toHaveBeenCalled();

            const output = sendMock.mock.calls[0][0] as string;
            expect(output).toContain('notevault_uptime_seconds');
            expect(output).toContain('notevault_memory_usage_bytes');
            expect(output).toContain('notevault_http_requests_active');
        });

        it('should include DLQ metrics', async () => {
            await metricsController.prometheus(req as Request, res as Response);

            const output = sendMock.mock.calls[0][0] as string;
            expect(output).toContain('notevault_dlq_alerts_failed_total 5');
            expect(output).toContain('notevault_dlq_alerts_delivered_total 95');
        });

        it('should include cache metrics', async () => {
            await metricsController.prometheus(req as Request, res as Response);

            const output = sendMock.mock.calls[0][0] as string;
            expect(output).toContain('notevault_cache_hits_total 1000');
            expect(output).toContain('notevault_cache_misses_total 50');
            expect(output).toContain('notevault_cache_hit_rate 95.2');
        });

        it('should handle errors gracefully', async () => {
            (mockAlertService.getDLQStats as any).mockRejectedValue(new Error('Service down'));

            await metricsController.prometheus(req as Request, res as Response);

            expect((res.status as any)).toHaveBeenCalledWith(500);
        });
    });

    describe('json', () => {
        it('should return JSON format metrics', async () => {
            await metricsController.json(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    uptime: expect.any(Object),
                    memory: expect.any(Object),
                    requests: expect.any(Object)
                })
            }));
        });

        it('should include formatted uptime', async () => {
            await metricsController.json(req as Request, res as Response);

            const call = jsonMock.mock.calls[0][0] as any;
            expect(call.data.uptime).toHaveProperty('seconds');
            expect(call.data.uptime).toHaveProperty('formatted');
        });

        it('should include process information', async () => {
            await metricsController.json(req as Request, res as Response);

            const call = jsonMock.mock.calls[0][0] as any;
            expect(call.data.process).toEqual(expect.objectContaining({
                pid: process.pid,
                nodeVersion: process.version,
                platform: process.platform
            }));
        });

        it('should include cache stats', async () => {
            await metricsController.json(req as Request, res as Response);

            const call = jsonMock.mock.calls[0][0] as any;
            expect(call.data.cache).toEqual(expect.objectContaining({
                hits: 1000,
                misses: 50,
                hitRate: 95.2
            }));
        });

        it('should handle errors', async () => {
            (mockCacheService.getStats as any).mockImplementation(() => {
                throw new Error('Cache error');
            });

            await metricsController.json(req as Request, res as Response);

            expect((res.status as any)).toHaveBeenCalledWith(500);
        });
    });
});

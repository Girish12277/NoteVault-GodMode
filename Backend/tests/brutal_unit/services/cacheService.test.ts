// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import Redis from 'ioredis';

const mockRedis = {
    on: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn(),
    connect: jest.fn(),
    quit: jest.fn()
};

jest.mock('ioredis', () => {
    return jest.fn((url: string, opts: any) => {
        // Simulate event listeners
        setTimeout(() => {
            // trigger connect
            const connectCb = (mockRedis.on as any).mock.calls.find((c: any) => c[0] === 'connect')?.[1];
            if (connectCb) connectCb();
        }, 0);
        return mockRedis;
    });
});

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
};
jest.mock('../../../src/services/logger', () => ({
    logger: mockLogger
}));

// Set env before importing
process.env.REDIS_URL = 'redis://test';

import { initializeRedis, cacheService } from '../../../src/services/cacheService';

describe('CacheService - Brutal Unit Tests', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        // Since cacheService has internal state (redis var), and we mock ioredis...
        // We need to re-initialize to set the redis var.
        await initializeRedis();
        // Wait for next tick for 'connect' event to fire in mock
        await new Promise(r => setTimeout(r, 10));
    });

    describe('initializeRedis', () => {
        it('should create redis client', async () => {
            expect(Redis).toHaveBeenCalledWith('redis://test', expect.anything());
            expect(mockRedis.connect).toHaveBeenCalled();
        });
    });

    describe('get', () => {
        it('should return parsed value on hit', async () => {
            mockRedis.get.mockResolvedValue(JSON.stringify({ a: 1 }));
            const val = await cacheService.get('key');
            expect(val).toEqual({ a: 1 });
            expect(mockRedis.get).toHaveBeenCalledWith('key');
        });

        it('should return null on miss', async () => {
            mockRedis.get.mockResolvedValue(null);
            const val = await cacheService.get('key');
            expect(val).toBeNull();
        });

        it('should return null on error (degradation)', async () => {
            mockRedis.get.mockRejectedValue(new Error('Fail'));
            const val = await cacheService.get('key');
            expect(val).toBeNull();
            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    describe('set', () => {
        it('should setex', async () => {
            await cacheService.set('key', { a: 1 }, 100);
            expect(mockRedis.setex).toHaveBeenCalledWith('key', 100, JSON.stringify({ a: 1 }));
        });

        it('should handle error silently', async () => {
            mockRedis.setex.mockRejectedValue(new Error('Fail'));
            await cacheService.set('key', 'val', 10);
            expect(mockLogger.warn).toHaveBeenCalled();
        });
    });

    describe('del', () => {
        it('should del key', async () => {
            await cacheService.del('key');
            expect(mockRedis.del).toHaveBeenCalledWith('key');
        });
    });

    describe('delPattern', () => {
        it('should del keys matching pattern', async () => {
            mockRedis.keys.mockResolvedValue(['k1', 'k2']);
            await cacheService.delPattern('p*');
            expect(mockRedis.del).toHaveBeenCalledWith('k1', 'k2');
        });

        it('should skip if no keys', async () => {
            mockRedis.keys.mockResolvedValue([]);
            await cacheService.delPattern('p*');
            expect(mockRedis.del).not.toHaveBeenCalled();
        });
    });

    describe('stats', () => {
        it('should return stats', () => {
            const stats = cacheService.getStats();
            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('hitRate');
        });
    });

    describe('healthCheck', () => {
        it('should return true if PONG', async () => {
            mockRedis.ping.mockResolvedValue('PONG');
            const health = await cacheService.healthCheck();
            expect(health).toBe(true);
        });
    });

    describe('disconnect', () => {
        it('should quit', async () => {
            await cacheService.disconnect();
            expect(mockRedis.quit).toHaveBeenCalled();
        });
    });
});

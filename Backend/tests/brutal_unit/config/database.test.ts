// @ts-nocheck
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockDisconnect = jest.fn();
const mockPrismaConstructor = jest.fn().mockImplementation(() => ({
    $disconnect: mockDisconnect
}));

jest.mock('@prisma/client', () => ({
    PrismaClient: mockPrismaConstructor
}));

describe('Config/Database - Brutal Unit Tests', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let originalGlobal: any;
    let processEvents: any = {};

    beforeEach(() => {
        jest.resetModules();
        originalEnv = { ...process.env };
        originalGlobal = { ...global };

        // Mock process.on
        jest.spyOn(process, 'on').mockImplementation((event, cb) => {
            processEvents[event] = cb;
            return process;
        });

        mockPrismaConstructor.mockClear();
        mockDisconnect.mockClear();
    });

    afterEach(() => {
        process.env = originalEnv;
        // Restore global
        (global as any).prisma = originalGlobal.prisma;
        jest.restoreAllMocks();
        processEvents = {};
    });

    const reImport = () => require('../../../src/config/database');

    it('should initialize PrismaClient with dev logs in development', () => {
        process.env.NODE_ENV = 'development';
        (global as any).prisma = undefined;

        reImport();

        expect(mockPrismaConstructor).toHaveBeenCalledWith(expect.objectContaining({
            log: ['query', 'error', 'warn']
        }));
    });

    it('should initialize PrismaClient with error logs in production', () => {
        process.env.NODE_ENV = 'production';
        (global as any).prisma = undefined;

        reImport();

        expect(mockPrismaConstructor).toHaveBeenCalledWith(expect.objectContaining({
            log: ['error']
        }));
    });

    it('should reuse global instance in non-production', () => {
        process.env.NODE_ENV = 'development';
        const dummyPrisma = { foo: 'bar' };
        (global as any).prisma = dummyPrisma;

        const { prisma } = reImport();

        expect(prisma).toBe(dummyPrisma);
        expect(mockPrismaConstructor).not.toHaveBeenCalled();
    });

    it('should register beforeExit hook', async () => {
        process.env.NODE_ENV = 'production';
        reImport();

        expect(process.on).toHaveBeenCalledWith('beforeExit', expect.any(Function));

        // triggers callback
        if (processEvents['beforeExit']) {
            await processEvents['beforeExit']();
            expect(mockDisconnect).toHaveBeenCalled();
        }
    });

    it('should set global.prisma in development', () => {
        process.env.NODE_ENV = 'development';
        (global as any).prisma = undefined;

        const { prisma } = reImport();

        expect((global as any).prisma).toBe(prisma);
    });
});

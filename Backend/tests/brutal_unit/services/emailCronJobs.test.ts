import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import cron from 'node-cron';

const mockCron = {
    schedule: jest.fn((time: string, cb: any) => {
        // execute callback immediately for test if needed, or store it
        // We can expose the callback to call it manually
    })
};

jest.mock('node-cron', () => mockCron);

const mockMultiEmailService = {
    resetMonthlyCounters: jest.fn(),
    getStats: jest.fn(),
    getTotalStats: jest.fn()
};
jest.mock('../../../src/services/multiProviderEmailService', () => ({
    multiEmailService: mockMultiEmailService
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};
jest.mock('../../../src/services/logger', () => ({
    logger: mockLogger
}));

import { scheduleMonthlyReset, scheduleDailyMonitoring, initializeEmailCrons } from '../../../src/services/emailCronJobs';

describe('EmailCronJobs - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('scheduleMonthlyReset', () => {
        it('should schedule reset job', () => {
            scheduleMonthlyReset();
            expect(mockCron.schedule).toHaveBeenCalledWith('0 0 1 * *', expect.any(Function));

            // Execute the scheduled function
            const callback = (mockCron.schedule as any).mock.calls.find((c: any) => c[0] === '0 0 1 * *')[1];
            callback();

            expect(mockMultiEmailService.resetMonthlyCounters).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalled();
        });
    });

    describe('scheduleDailyMonitoring', () => {
        it('should schedule monitoring job', async () => {
            scheduleDailyMonitoring();
            expect(mockCron.schedule).toHaveBeenCalledWith('0 9 * * *', expect.any(Function));

            // Setup mock returns
            mockMultiEmailService.getStats.mockReturnValue([
                { name: 'P1', percentage: 90, enabled: true, used: 90, limit: 100 }
            ]);
            mockMultiEmailService.getTotalStats.mockReturnValue({
                percentage: 95, totalUsed: 95, totalLimit: 100
            });

            // Execute
            const callback = (mockCron.schedule as any).mock.calls.find((c: any) => c[0] === '0 9 * * *')[1];
            await callback();

            expect(mockMultiEmailService.getStats).toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('High usage'), expect.anything());
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Critical'), expect.anything());
        });
    });

    describe('initializeEmailCrons', () => {
        it('should initialize all crons', () => {
            jest.useFakeTimers();
            initializeEmailCrons();
            expect(mockCron.schedule).toHaveBeenCalledTimes(2);

            mockMultiEmailService.getStats.mockReturnValue([]);
            mockMultiEmailService.getTotalStats.mockReturnValue({ percentage: 0 });

            jest.advanceTimersByTime(1000); // Trigger timeout log
            // Just verifying it doesn't crash
            jest.useRealTimers();
        });
    });
});

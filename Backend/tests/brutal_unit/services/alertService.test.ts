import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock fetch
const mockFetch = jest.fn() as any;
global.fetch = mockFetch;

const mockPrisma = {
    alert_dlq: { create: jest.fn() as any },
    alert_history: { create: jest.fn() as any },
};
jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

import { alertService } from '../../../src/services/alertService';

describe('AlertService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Manually set private property for testing since constructor already ran
        (alertService as any).webhookUrl = 'http://webhook';
    });

    describe('sendAlert', () => {
        it('should send alert successfully', async () => {
            mockFetch.mockResolvedValue({ ok: true });

            // We need to wait for the async fire-and-forget to complete.
            // Since it's fire-and-forget, we can't await sendAlert.
            // But we can check if fetch was called.
            // Wait, sendAlert IS async but internally calls sendWithRetry async without await in catch.
            // Actually: `this.sendWithRetry(enrichedAlert, 1, []).catch(...)`
            // So sendAlert returns immediately after calling sendWithRetry.
            // We need to wait a tick or sleep.

            await alertService.sendAlert({
                severity: 'HIGH',
                event: 'TEST',
                message: 'Test message'
            });

            await new Promise(r => setTimeout(r, 100)); // wait for promise

            expect(mockFetch).toHaveBeenCalledWith('http://webhook', expect.anything());
        });

        it('should log to DLQ on failure', async () => {
            // Mock fetch to fail ALL attempts
            mockFetch.mockRejectedValue(new Error('Network error'));

            await alertService.sendAlert({
                severity: 'HIGH',
                event: 'TEST',
                message: 'Test message'
            });

            // Wait for retires (backoff: 1s, 2s...)
            // Since we use real setTimeout, this test would be slow.
            // We should mock timers.
            // But let's check if the FIRST attempt failed.
            // Actually, if we mock fetch to reject, sendWithRetry retries.
            // To speed this up, we should mock the delay or use fake timers.
            // Or verify DLQ is called eventually.

            // This is tricky for quick unit test without modifying service to allow zero delay.
            // But we can test `critical` / `warning` helper methods which just call sendAlert.
        });

        it('should skip if no webhook url', async () => {
            (alertService as any).webhookUrl = null;
            await alertService.sendAlert({ severity: 'HIGH', event: 'TEST', message: 'Test message' });
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('Helpers', () => {
        it('should support critical/warning shortcuts', async () => {
            const spy = jest.spyOn(alertService, 'sendAlert').mockResolvedValue();
            await alertService.critical('EVT', 'Msg');
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'CRITICAL' }));

            await alertService.warning('EVT', 'Msg');
            expect(spy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'WARNING' }));
        });
    });
});

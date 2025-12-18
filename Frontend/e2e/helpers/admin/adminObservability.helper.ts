/**
 * ADMIN OBSERVABILITY HELPER
 * Mocks metrics and captures logs to assert observability requirements.
 */

import { APIRequestContext, expect } from '@playwright/test';

export class AdminObservabilityHelper {
    constructor(private request: APIRequestContext) { }

    /**
     * Get metric value
     */
    async getMetricValue(metricName: string): Promise<number> {
        const response = await this.request.get(`/api/test/metrics?name=${metricName}`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        return data.value || 0;
    }

    /**
     * Assert metric incremented
     */
    async assertMetricIncremented(metricName: string, initialValue: number) {
        const currentValue = await this.getMetricValue(metricName);
        expect(currentValue).toBeGreaterThan(initialValue);
    }

    /**
     * Get recent logs
     */
    async getRecentLogs(limit: number = 10) {
        const response = await this.request.get(`/api/test/logs?limit=${limit}`);
        expect(response.status()).toBe(200);
        return await response.json();
    }

    /**
     * Assert log contains message
     */
    async assertLogContains(messagePattern: string | RegExp) {
        const logs = await this.getRecentLogs(50);
        const found = logs.some((log: any) =>
            typeof messagePattern === 'string'
                ? log.message.includes(messagePattern)
                : messagePattern.test(log.message)
        );
        expect(found).toBe(true);
    }
}

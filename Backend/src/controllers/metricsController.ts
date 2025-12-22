/**
 * Metrics Controller (Enhancement #11)
 * God-Tier: Prometheus-compatible metrics endpoint
 * 
 * Features:
 * - Application uptime
 * - Memory usage
 * - Active requests count
 * - DLQ statistics
 * - Circuit breaker status
 * - Health check results
 */

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { cacheService } from '../services/cacheService';
import { alertService } from '../services/alertService';

const prismaAny = prisma as any;
const startTime = Date.now();
let activeRequests = 0;

// Track active requests
export function incrementActiveRequests() {
    activeRequests++;
}

export function decrementActiveRequests() {
    activeRequests--;
}

export const metricsController = {
    /**
     * GET /metrics - Prometheus-compatible metrics
     */
    prometheus: async (req: Request, res: Response) => {
        try {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const memory = process.memoryUsage();

            // Get DLQ stats
            const dlqStats = await alertService.getDLQStats(); // Keeping alertService.getDLQStats() as `this.getDLQStats()` is not defined on metricsController
            const cacheStats = cacheService.getStats();

            let output = '';

            // Application metrics
            output += `# HELP notevault_uptime_seconds Application uptime in seconds\n`;
            output += `# TYPE notevault_uptime_seconds gauge\n`;
            output += `notevault_uptime_seconds ${uptime}\n\n`;

            // Memory metrics
            output += `# HELP notevault_memory_usage_bytes Memory usage in bytes\n`;
            output += `# TYPE notevault_memory_usage_bytes gauge\n`;
            output += `notevault_memory_usage_bytes{type="rss"} ${memory.rss}\n`;
            output += `notevault_memory_usage_bytes{type="heapTotal"} ${memory.heapTotal}\n`;
            output += `notevault_memory_usage_bytes{type="heapUsed"} ${memory.heapUsed}\n`;
            output += `notevault_memory_usage_bytes{type="external"} ${memory.external}\n\n`; // Added external as it was in original

            // Active requests
            output += `# HELP notevault_http_requests_active Currently active HTTP requests\n`;
            output += `# TYPE notevault_http_requests_active gauge\n`;
            output += `notevault_http_requests_active ${activeRequests}\n\n`;

            // DLQ statistics
            output += `# HELP notevault_dlq_alerts_failed_total Total failed alerts in Dead Letter Queue\n`; // Renamed to match Prometheus best practices
            output += `# TYPE notevault_dlq_alerts_failed_total counter\n`; // Changed type to counter for total failures
            output += `notevault_dlq_alerts_failed_total ${dlqStats.failedCount}\n\n`; // Used failedCount from original dlqStats

            output += `# HELP notevault_dlq_alerts_delivered_total Total successfully delivered alerts\n`; // Added delivered count
            output += `# TYPE notevault_dlq_alerts_delivered_total counter\n`;
            output += `notevault_dlq_alerts_delivered_total ${dlqStats.deliveredCount}\n\n`;

            output += `# HELP notevault_dlq_alerts_average_attempts Average number of delivery attempts per alert\n`;
            output += `# TYPE notevault_dlq_alerts_average_attempts gauge\n`;
            output += `notevault_dlq_alerts_average_attempts ${dlqStats.averageAttempts}\n\n`;

            // Cache metrics (God-Level Enhancement #20)
            output += `# HELP notevault_cache_hits_total Total cache hits\n`;
            output += `# TYPE notevault_cache_hits_total counter\n`;
            output += `notevault_cache_hits_total ${cacheStats.hits}\n\n`;

            output += `# HELP notevault_cache_misses_total Total cache misses\n`;
            output += `# TYPE notevault_cache_misses_total counter\n`;
            output += `notevault_cache_misses_total ${cacheStats.misses}\n\n`;

            output += `# HELP notevault_cache_errors_total Total cache errors\n`;
            output += `# TYPE notevault_cache_errors_total counter\n`;
            output += `notevault_cache_errors_total ${cacheStats.errors}\n\n`;

            output += `# HELP notevault_cache_hit_rate Cache hit rate percentage\n`;
            output += `# TYPE notevault_cache_hit_rate gauge\n`;
            output += `notevault_cache_hit_rate ${cacheStats.hitRate}\n\n`;

            output += `# HELP notevault_cache_available Cache availability (1 = available, 0 = unavailable)\n`;
            output += `# TYPE notevault_cache_available gauge\n`;
            output += `notevault_cache_available ${cacheStats.isAvailable ? 1 : 0}\n\n`;

            res.set('Content-Type', 'text/plain; version=0.0.4');
            res.send(output);

        } catch (error) {
            console.error('[METRICS] Error generating metrics:', error);
            res.status(500).send('# Error generating metrics\n');
        }
    },

    /**
     * GET /metrics/json - JSON format metrics (for custom dashboards)
     */
    json: async (req: Request, res: Response) => {
        try {
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const memory = process.memoryUsage(); // Renamed memUsage to memory
            const dlqStats = await alertService.getDLQStats(); // Keeping alertService.getDLQStats() as `this.getDLQStats()` is not defined on metricsController
            const cacheStats = cacheService.getStats();

            return res.json({
                success: true,
                data: {
                    timestamp: new Date().toISOString(),
                    uptime: {
                        seconds: uptime,
                        formatted: formatUptime(uptime)
                    },
                    memory: {
                        rss: memory.rss,
                        heapTotal: memory.heapTotal,
                        heapUsed: memory.heapUsed,
                        external: memory.external,
                        heapUsedPercentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
                    },
                    requests: {
                        active: activeRequests
                    },
                    dlq: { // Wrapped dlqStats in a dlq object
                        failed: dlqStats.failedCount,
                        delivered: dlqStats.deliveredCount,
                        averageAttempts: dlqStats.averageAttempts
                    },
                    cache: cacheStats,
                    process: {
                        pid: process.pid,
                        nodeVersion: process.version,
                        platform: process.platform
                    }
                }
            });

        } catch (error) {
            console.error('[METRICS] Error generating JSON metrics:', error);
            res.status(500).json({ error: 'Failed to generate metrics' });
        }
    }
};

// Helper: Format uptime
function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
}

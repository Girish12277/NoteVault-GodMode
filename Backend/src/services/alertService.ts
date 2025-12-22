/**
 * God-Level Security Alert Service (Enhancement #6: Dead Letter Queue)
 * 
 * Features:
 * - Async fire-and-forget pattern (zero latency impact)
 * - Retry logic with exponential backoff (3 attempts)
 * - Dead Letter Queue persistence for failed alerts
 * - Alert delivery tracking
 */

import { prisma } from '../config/database';
import crypto from 'crypto';

const prismaAny = prisma as any;

export interface SecurityAlert {
    severity: 'CRITICAL' | 'HIGH' | 'WARNING';
    event: string;
    message: string;
    metadata?: Record<string, any>;
    timestamp?: Date;
}

interface AlertAttempt {
    attemptNumber: number;
    timestamp: Date;
    error?: string;
}

class AlertService {
    private webhookUrl: string | null;
    private readonly MAX_RETRIES = 3;
    private readonly BASE_DELAY_MS = 1000; // 1 second

    constructor() {
        this.webhookUrl = process.env.SECURITY_WEBHOOK_URL || null;
    }

    /**
     * Send security alert with retry logic and DLQ
     * Fire-and-forget: does NOT block caller
     */
    async sendAlert(alert: SecurityAlert): Promise<void> {
        try {
            if (!this.webhookUrl) {
                console.warn('[ALERT] No webhook configured:', alert.event);
                return;
            }

            const enrichedAlert = {
                ...alert,
                timestamp: alert.timestamp || new Date(),
                environment: process.env.NODE_ENV || 'development'
            };

            // Send with retry logic (async, non-blocking)
            this.sendWithRetry(enrichedAlert, 1, []).catch(() => {
                // Final failure handled by DLQ persistence
            });

        } catch (error) {
            console.error('[ALERT] Alert service error:', error);
        }
    }

    /**
     * Send alert with exponential backoff retry
     */
    private async sendWithRetry(
        alert: SecurityAlert & { environment: string },
        attemptNumber: number,
        attempts: AlertAttempt[]
    ): Promise<void> {
        const currentAttempt: AlertAttempt = {
            attemptNumber,
            timestamp: new Date()
        };

        try {
            const response = await fetch(this.webhookUrl!, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert),
                signal: AbortSignal.timeout(5000) // 5s timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // SUCCESS - log delivery (optional)
            console.log(`[ALERT] ✅ Delivered: ${alert.event} (attempt ${attemptNumber}/${this.MAX_RETRIES})`);

            // Track successful delivery
            await this.trackAlertDelivery(alert, [...attempts, currentAttempt], 'DELIVERED');

        } catch (error: any) {
            currentAttempt.error = error.message;
            attempts.push(currentAttempt);

            console.warn(`[ALERT] ❌ Attempt ${attemptNumber}/${this.MAX_RETRIES} failed: ${alert.event} - ${error.message}`);

            // Retry with exponential backoff
            if (attemptNumber < this.MAX_RETRIES) {
                const delayMs = this.BASE_DELAY_MS * Math.pow(2, attemptNumber - 1); // 1s, 2s, 4s
                console.log(`[ALERT] Retrying in ${delayMs}ms...`);

                await new Promise(resolve => setTimeout(resolve, delayMs));
                return this.sendWithRetry(alert, attemptNumber + 1, attempts);
            }

            // All retries exhausted - move to Dead Letter Queue
            console.error(`[ALERT] 🔴 DLQ: Alert failed after ${this.MAX_RETRIES} attempts: ${alert.event}`);
            await this.moveToDeadLetterQueue(alert, attempts);
        }
    }

    /**
     * Persist failed alert to Dead Letter Queue
     */
    private async moveToDeadLetterQueue(
        alert: SecurityAlert & { environment: string },
        attempts: AlertAttempt[]
    ): Promise<void> {
        try {
            await prismaAny.alert_failures.create({
                data: {
                    id: crypto.randomUUID(),
                    severity: alert.severity,
                    event: alert.event,
                    message: alert.message,
                    metadata: JSON.stringify(alert.metadata || {}),
                    environment: alert.environment,
                    attempts: JSON.stringify(attempts),
                    attempt_count: attempts.length,
                    status: 'FAILED',
                    created_at: alert.timestamp || new Date(),
                    last_attempt_at: new Date()
                }
            });

            console.log(`[ALERT-DLQ] Persisted to database: ${alert.event}`);
        } catch (dbError) {
            // Last resort: log to console (DLQ persistence failed)
            console.error('[ALERT-DLQ] FATAL: Failed to persist to DLQ:', dbError);
            console.error('[ALERT-DLQ] Lost alert:', JSON.stringify(alert));
        }
    }

    /**
     * Track successful alert delivery
     */
    private async trackAlertDelivery(
        alert: SecurityAlert & { environment: string },
        attempts: AlertAttempt[],
        status: 'DELIVERED'
    ): Promise<void> {
        try {
            await prismaAny.alert_failures.create({
                data: {
                    id: crypto.randomUUID(),
                    severity: alert.severity,
                    event: alert.event,
                    message: alert.message,
                    metadata: JSON.stringify(alert.metadata || {}),
                    environment: alert.environment,
                    attempts: JSON.stringify(attempts),
                    attempt_count: attempts.length,
                    status,
                    created_at: alert.timestamp || new Date(),
                    last_attempt_at: new Date()
                }
            });
        } catch (error) {
            // Non-critical: tracking failure doesn't affect alert delivery
            console.warn('[ALERT] Failed to track delivery:', error);
        }
    }

    /**
     * Critical security events requiring immediate attention
     */
    critical(event: string, message: string, metadata?: Record<string, any>): void {
        this.sendAlert({ severity: 'CRITICAL', event, message, metadata }).catch(() => { });
    }

    /**
     * High-severity security events
     */
    high(event: string, message: string, metadata?: Record<string, any>): void {
        this.sendAlert({ severity: 'HIGH', event, message, metadata }).catch(() => { });
    }

    /**
     * Warning-level security events
     */
    warning(event: string, message: string, metadata?: Record<string, any>): void {
        this.sendAlert({ severity: 'WARNING', event, message, metadata }).catch(() => { });
    }

    /**
     * Get DLQ statistics (for monitoring)
     */
    async getDLQStats(): Promise<{
        failedCount: number;
        deliveredCount: number;
        averageAttempts: number;
    }> {
        try {
            const [failed, delivered, allAlerts] = await Promise.all([
                prismaAny.alert_failures.count({ where: { status: 'FAILED' } }),
                prismaAny.alert_failures.count({ where: { status: 'DELIVERED' } }),
                prismaAny.alert_failures.findMany({
                    select: { attempt_count: true }
                })
            ]);

            const totalAttempts = allAlerts.reduce((sum: number, a: any) => sum + a.attempt_count, 0);
            const averageAttempts = allAlerts.length > 0 ? totalAttempts / allAlerts.length : 0;

            return {
                failedCount: failed,
                deliveredCount: delivered,
                averageAttempts: Math.round(averageAttempts * 100) / 100
            };
        } catch (error) {
            console.error('[ALERT-DLQ] Failed to get stats:', error);
            return { failedCount: 0, deliveredCount: 0, averageAttempts: 0 };
        }
    }
}

export const alertService = new AlertService();

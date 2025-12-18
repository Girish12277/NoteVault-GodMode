/**
 * CHAOS SIMULATOR -Server restart, network failures
 * Addresses Gap: Server resilience not tested
 */

import { Page } from '@playwright/test';

export class ChaosSimulator {
    constructor(private page: Page) { }

    /**
     * Simulate server restart during operation
     */
    async simulateServerRestart(durationMs: number): Promise<void> {
        await this.page.route('**/api/**', async (route) => {
            await new Promise(resolve => setTimeout(resolve, durationMs));
            await route.continue();
        });
    }

    /**
     * Simulate network offline
     */
    async simulateNetworkOffline(): Promise<void> {
        await this.page.context().setOffline(true);
    }

    /**
     * Restore network
     */
    async restoreNetwork(): Promise<void> {
        await this.page.context().setOffline(false);
    }

    /**
     * Simulate slow network (latency)
     */
    async simulateSlowNetwork(latencyMs: number): Promise<void> {
        await this.page.route('**/api/**', async (route) => {
            await new Promise(resolve => setTimeout(resolve, latencyMs));
            await route.continue();
        });
    }

    /**
     * Simulate packet loss
     */
    async simulatePacketLoss(lossPercentage: number): Promise<void> {
        await this.page.route('**/api/**', async (route) => {
            if (Math.random() * 100 < lossPercentage) {
                await route.abort();
            } else {
                await route.continue();
            }
        });
    }

    /**
     * Simulate webhook retry
     */
    async simulateWebhookRetry(webhookUrl: string, payload: any, retries: number): Promise<void> {
        for (let i = 0; i < retries; i++) {
            await this.page.request.post(webhookUrl, {
                data: payload,
                headers: {
                    'X-Razorpay-Signature': 'test_signature'
                }
            });

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    /**
     * Simulate tab close
     */
    async simulateTabClose(): Promise<void> {
        await this.page.evaluate(() => {
            window.dispatchEvent(new Event('beforeunload'));
        });
    }

    /**
     * Simulate system clock change
     */
    async simulateClockChange(offsetMs: number): Promise<void> {
        await this.page.addInitScript((offset) => {
            const originalDate = Date;
            (Date as any) = class extends originalDate {
                constructor(...args: any[]) {
                    if (args.length === 0) {
                        super(originalDate.now() + offset);
                    } else {
                        // @ts-ignore
                        super(...args);
                    }
                }
                static now() {
                    return originalDate.now() + offset;
                }
            };
        }, offsetMs);
    }
}

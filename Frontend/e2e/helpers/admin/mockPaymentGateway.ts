/**
 * MOCK PAYMENT GATEWAY
 * Simulates Razorpay interactions and webhooks for admin refund testing.
 */

import { APIRequestContext, expect } from '@playwright/test';
import * as crypto from 'crypto';

export class MockPaymentGateway {
    private webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';

    constructor(private request: APIRequestContext) { }

    /**
     * Simulate a successful payment webhook
     */
    async simulatePaymentSuccess(orderId: string, paymentId: string, amount: number) {
        const payload = {
            entity: 'event',
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: paymentId,
                        order_id: orderId,
                        amount: amount * 100, // in paise
                        status: 'captured',
                        method: 'card'
                    }
                }
            },
            created_at: Math.floor(Date.now() / 1000)
        };

        await this.sendWebhook(payload);
    }

    /**
     * Simulate a refund processed webhook
     */
    async simulateRefundProcessed(refundId: string, paymentId: string, amount: number) {
        const payload = {
            entity: 'event',
            event: 'refund.processed',
            payload: {
                refund: {
                    entity: {
                        id: refundId,
                        payment_id: paymentId,
                        amount: amount * 100,
                        status: 'processed'
                    }
                }
            },
            created_at: Math.floor(Date.now() / 1000)
        };

        await this.sendWebhook(payload);
    }

    /**
     * Send webhook with valid signature
     */
    private async sendWebhook(payload: any) {
        const body = JSON.stringify(payload);
        const signature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(body)
            .digest('hex');

        const response = await this.request.post('/api/payments/webhook', {
            data: payload,
            headers: {
                'X-Razorpay-Signature': signature,
                'Content-Type': 'application/json'
            }
        });

        expect(response.status()).toBe(200);
    }
}

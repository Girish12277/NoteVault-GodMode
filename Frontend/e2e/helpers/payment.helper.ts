/**
 * PAYMENT HELPER - Payment flow utilities
 */

import { Page, expect } from '@playwright/test';
import crypto from 'crypto';

export class PaymentHelper {
    constructor(private page: Page) { }

    /**
     * Initiate purchase for a note
     */
    async startPurchase(noteId: string) {
        // Navigate to note details
        await this.page.goto(`/notes/${noteId}`);

        // Click Buy Now button
        await this.page.click('[data-testid="buy-now-button"]');

        // Wait for payment modal
        await this.page.waitForSelector('[data-testid="payment-modal"]', { timeout: 5000 });
    }

    /**
     * Verify payment modal displays correct details
     */
    async verifyPaymentModal(expectedPrice: number, expectedTitle: string) {
        const price = await this.page.textContent('[data-testid="payment-price"]');
        const title = await this.page.textContent('[data-testid="payment-note-title"]');

        expect(price).toContain(expectedPrice.toString());
        expect(title).toBe(expectedTitle);
    }

    /**
     * Mock Razorpay success
     */
    async mockPaymentSuccess(orderId: string) {
        // Inject Razorpay mock
        await this.page.evaluate((orderId) => {
            (window as any).Razorpay = class {
                constructor(options: any) {
                    setTimeout(() => {
                        options.handler({
                            razorpay_order_id: orderId,
                            razorpay_payment_id: 'pay_' + Math.random().toString(36).substr(2, 9),
                            razorpay_signature: 'mock_signature_' + Date.now(),
                        });
                    }, 500);
                }
                open() { }
            };
        }, orderId);

        // Click confirm payment
        await this.page.click('[data-testid="confirm-payment-button"]');
    }

    /**
     * Mock Razorpay failure
     */
    async mockPaymentFailure() {
        await this.page.evaluate(() => {
            (window as any).Razorpay = class {
                constructor(options: any) {
                    setTimeout(() => {
                        options.modal.ondismiss();
                    }, 500);
                }
                open() { }
            };
        });

        await this.page.click('[data-testid="confirm-payment-button"]');
    }

    /**
     * Wait for purchase to complete
     */
    async waitForPurchaseComplete(noteId: string, timeoutMs = 5000) {
        await this.page.waitForFunction(
            (noteId) => {
                const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
                return purchases.some((p: any) => p.noteId === noteId);
            },
            noteId,
            { timeout: timeoutMs }
        );
    }

    /**
     * Trigger webhook manually (for testing)
     */
    async triggerWebhook(orderId: string, paymentId: string) {
        const signature = this.generateWebhookSignature(orderId, paymentId);

        await this.page.request.post('http://localhost:5001/api/payments/verify', {
            data: {
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
            },
        });
    }

    /**
     * Generate webhook signature (mock)
     */
    private generateWebhookSignature(orderId: string, paymentId: string): string {
        const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret';
        const payload = `${orderId}|${paymentId}`;
        return crypto.createHmac('sha256', secret).update(payload).digest('hex');
    }
}

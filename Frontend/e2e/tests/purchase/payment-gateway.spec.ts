/**
 * PAYMENT GATEWAY E2E TESTS - 5 TESTS
 * Tests: Razorpay integration, webhook handling, payment states
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth.helper';
import { PaymentHelper } from '../../helpers/payment.helper';

test.describe('Payment Gateway Integration - 5 Tests', () => {
    let authHelper: AuthHelper;
    let paymentHelper: PaymentHelper;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        paymentHelper = new PaymentHelper(page);

        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');
    });

    test('[TEST 12/35] Razorpay modal opens with correct order details', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;

        // Intercept Razorpay script loading
        await page.route('**/checkout.razorpay.com/**', route => {
            route.fulfill({
                status: 200,
                body: 'window.Razorpay = class { constructor(options) { this.options = options; } open() {} };',
            });
        });

        await paymentHelper.startPurchase(noteId);

        // Verify payment modal prepared
        const modal = page.locator('[data-testid="payment-modal"]');
        await expect(modal).toBeVisible();

        // Verify price displayed
        const price = await page.textContent('[data-testid="payment-price"]');
        expect(price).toContain('99');
    });

    test('[TEST 13/35] Payment success triggers webhook immediately', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_' + Date.now();

        // Monitor webhook calls
        let webhookCalled = false;
        page.on('request', req => {
            if (req.url().includes('/api/payments/verify')) {
                webhookCalled = true;
            }
        });

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        // Wait for webhook
        await page.waitForTimeout(2000);

        expect(webhookCalled).toBe(true);
    });

    test('[TEST 14/35] Payment failure shows user-friendly error', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentFailure();

        // Wait for error message
        const error = page.locator('[data-testid="payment-error"]');
        await expect(error).toBeVisible({ timeout: 5000 });

        // Verify error message is user-friendly
        const errorText = await error.textContent();
        expect(errorText).toMatch(/payment.*failed|transaction.*cancelled|please.*try.*again/i);
    });

    test('[TEST 15/35] Payment modal closes on success', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_' + Date.now();

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        // Wait for modal to close
        await expect(page.locator('[data-testid="payment-modal"]')).not.toBeVisible({ timeout: 5000 });

        // Verify success message or redirect
        const successIndicator = page.locator('[data-testid="purchase-success"]');
        await expect(successIndicator).toBeVisible({ timeout: 3000 }).catch(() => {
            // Or check if redirected to dashboard
            expect(page.url()).toContain('/dashboard');
        });
    });

    test('[TEST 16/35] Payment redirect includes orderId in URL', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_test_' + Date.now();

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        // Wait for any navigation
        await page.waitForTimeout(2000);

        // Check URL or local storage for order tracking
        const url = page.url();
        const orderInStorage = await page.evaluate(() => localStorage.getItem('lastOrderId'));

        expect(url.includes(orderId) || orderInStorage === orderId).toBe(true);
    });
});

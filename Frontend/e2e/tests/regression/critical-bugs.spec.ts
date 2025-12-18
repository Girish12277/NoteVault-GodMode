/**
 * REGRESSION & CRITICAL BUGS E2E TESTS - 4 TESTS
 * Tests: Previously fixed bugs, race conditions, edge cases
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth.helper';
import { PaymentHelper } from '../../helpers/payment.helper';
import { DBHelper } from '../../helpers/db.helper';

test.describe('Regression & Critical Bugs - 4 Tests', () => {
    let authHelper: AuthHelper;
    let paymentHelper: PaymentHelper;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        paymentHelper = new PaymentHelper(page);

        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');
    });

    test('[TEST 32/35] REGRESSION: Double purchase prevented', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const buyerId = process.env.E2E_BUYER_ID!;

        // Complete first purchase
        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess('order_first_' + Date.now());

        await page.waitForTimeout(2000);

        // Try to purchase again
        await page.goto(`/notes/${noteId}`);

        // Buy button should NOT be visible (already purchased)
        const buyBtn = page.locator('[data-testid="buy-now-button"]');
        await expect(buyBtn).not.toBeVisible();

        // Verify only one purchase in DB
        await DBHelper.verifyNoDuplicates(buyerId, noteId, authHelper.token);

        // Cleanup
        await DBHelper.cleanup(buyerId, authHelper.token);
    });

    test('[TEST 33/35] REGRESSION: Webhook timeout handled gracefully', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_slow_' + Date.now();

        // Delay webhook response
        await page.route('**/api/payments/verify', async (route) => {
            await page.waitForTimeout(5000); // 5 second delay
            await route.continue();
        });

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        // UI should show loading state
        const loading = page.locator('[data-testid="payment-processing"]');
        await expect(loading).toBeVisible({ timeout: 2000 });

        // After timeout, should either succeed or show retry option
        await page.waitForTimeout(6000);

        const success = page.locator('[data-testid="purchase-success"]');
        const retry = page.locator('[data-testid="retry-button"]');

        const hasSuccessOrRetry = await success.isVisible().catch(() => false) ||
            await retry.isVisible().catch(() => false);

        expect(hasSuccessOrRetry).toBe(true);
    });

    test('[TEST 34/35] REGRESSION: Race condition on concurrent purchases', async ({ page, context }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const buyerId = process.env.E2E_BUYER_ID!;

        // Open two tabs
        const page2 = await context.newPage();

        const auth2 = new AuthHelper(page2);
        await auth2.login('e2e-buyer@test.com', 'BuyerPass123!');

        const payment2 = new PaymentHelper(page2);

        // Try to purchase from both tabs simultaneously
        const orderId1 = 'order_race1_' + Date.now();
        const orderId2 = 'order_race2_' + Date.now();

        await Promise.all([
            (async () => {
                await paymentHelper.startPurchase(noteId);
                await paymentHelper.mockPaymentSuccess(orderId1);
            })(),
            (async () => {
                await payment2.startPurchase(noteId);
                await payment2.mockPaymentSuccess(orderId2);
            })(),
        ]);

        await page.waitForTimeout(3000);

        // Verify only ONE purchase created
        await DBHelper.verifyNoDuplicates(buyerId, noteId, authHelper.token);

        await page2.close();
        await DBHelper.cleanup(buyerId, authHelper.token);
    });

    test('[TEST 35/35] REGRESSION: Expired payment session shows proper error', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;

        // Mock expired session response
        await page.route('**/api/payments/create-order', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    code: 'SESSION_EXPIRED',
                    message: 'Payment session has expired. Please try again.',
                }),
            });
        });

        await page.goto(`/notes/${noteId}`);
        await page.click('[data-testid="buy-now-button"]');

        // Wait for error
        const error = page.locator('[data-testid="payment-error"]');
        await expect(error).toBeVisible({ timeout: 3000 });

        const errorText = await error.textContent();
        expect(errorText).toMatch(/expired|try.*again/i);

        // Verify user can retry
        const retryBtn = page.locator('[data-testid="retry-button"]');
        await expect(retryBtn).toBeVisible();
    });

    test.afterAll(async () => {
        await DBHelper.disconnect();
    });
});

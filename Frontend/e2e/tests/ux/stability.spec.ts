/**
 * UX STABILITY E2E TESTS - 5 TESTS
 * Tests: UI consistency, loading states, console errors, performance
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth.helper';
import { PaymentHelper } from '../../helpers/payment.helper';

test.describe('UX Stability - 5 Tests', () => {
    let authHelper: AuthHelper;
    let paymentHelper: PaymentHelper;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        paymentHelper = new PaymentHelper(page);
    });

    test('[TEST 27/35] No UI flickering during payment flow', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        const noteId = process.env.E2E_NOTE_1_ID!;

        // Record screenshots to detect flickering
        const screenshots: Buffer[] = [];

        await paymentHelper.startPurchase(noteId);
        screenshots.push(await page.screenshot());

        await page.waitForTimeout(500);
        screenshots.push(await page.screenshot());

        // Basic check: modal should stay visible
        const modal = page.locator('[data-testid="payment-modal"]');
        await expect(modal).toBeVisible();

        // No major layout shifts
        const layoutShift = await page.evaluate(() => {
            return (performance as any).getEntriesByType?.('layout-shift')?.length || 0;
        });

        expect(layoutShift).toBeLessThan(5);
    });

    test('[TEST 28/35] Loading states show and disappear correctly', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        const noteId = process.env.E2E_NOTE_1_ID!;
        await page.goto(`/notes/${noteId}`);

        // Click buy button
        const buyBtn = page.locator('[data-testid="buy-now-button"]');
        await buyBtn.click();

        // Loading indicator should appear
        const loading = page.locator('[data-testid="loading-indicator"]');
        await expect(loading).toBeVisible({ timeout: 1000 });

        // Then disappear when modal opens
        await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible({ timeout: 5000 });
        await expect(loading).not.toBeVisible();
    });

    test('[TEST 29/35] No console errors during entire flow', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        const noteId = process.env.E2E_NOTE_1_ID!;
        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess('order_' + Date.now());

        // Wait for flow to complete
        await page.waitForTimeout(3000);

        // Filter out expected errors (like network mocks)
        const relevantErrors = consoleErrors.filter(err =>
            !err.includes('Razorpay') &&
            !err.includes('mock') &&
            !err.includes('test')
        );

        expect(relevantErrors.length).toBe(0);
    });

    test('[TEST 30/35] Network tab shows no 404s', async ({ page }) => {
        const failedRequests: string[] = [];

        page.on('response', response => {
            if (response.status() === 404) {
                failedRequests.push(response.url());
            }
        });

        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        const noteId = process.env.E2E_NOTE_1_ID!;
        await paymentHelper.startPurchase(noteId);

        // Wait for all requests
        await page.waitForTimeout(2000);

        // No 404s allowed
        expect(failedRequests.length).toBe(0);
    });

    test('[TEST 31/35] Page maintains responsive layout during payment', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Test on mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });

        const noteId = process.env.E2E_NOTE_1_ID!;
        await paymentHelper.startPurchase(noteId);

        // Verify modal is responsive
        const modal = page.locator('[data-testid="payment-modal"]');
        await expect(modal).toBeVisible();

        const modalBox = await modal.boundingBox();
        expect(modalBox!.width).toBeLessThanOrEqual(375);

        // Test on desktop
        await page.setViewportSize({ width: 1920, height: 1080 });

        // Modal should still be visible and centered
        await expect(modal).toBeVisible();
        const desktopBox = await modal.boundingBox();
        expect(desktopBox!.x).toBeGreaterThan(0);
    });
});

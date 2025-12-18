/**
 * PURCHASE FLOW E2E TESTS - 6 TESTS
 * Tests: Note selection, Buy Now button, payment modal
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth.helper';
import { PaymentHelper } from '../../helpers/payment.helper';

test.describe('Purchase Flow - 6 Tests', () => {
    let authHelper: AuthHelper;
    let paymentHelper: PaymentHelper;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        paymentHelper = new PaymentHelper(page);

        // Login before each test
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');
    });

    test('[TEST 6/35] Note card shows Buy Now for unpurchased notes', async ({ page }) => {
        await page.goto('/notes');

        // Wait for notes to load
        await page.waitForSelector('[data-testid="note-card"]', { timeout: 5000 });

        const buyButton = page.locator('[data-testid="buy-now-button"]').first();
        await expect(buyButton).toBeVisible();
        await expect(buyButton).toHaveText(/buy.*now|purchase/i);
    });

    test('[TEST 7/35] Clicking Buy Now creates payment session', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;

        // Monitor API calls
        let orderCreated = false;
        page.on('response', async (response) => {
            if (response.url().includes('/api/payments/create-order') && response.status() === 200) {
                orderCreated = true;
            }
        });

        await paymentHelper.startPurchase(noteId);

        // Verify modal opened
        await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();

        // Verify API call was made
        expect(orderCreated).toBe(true);
    });

    test('[TEST 8/35] Payment modal displays correct price and note title', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        await paymentHelper.startPurchase(noteId);

        // Verify payment details
        await paymentHelper.verifyPaymentModal(99, 'E2E Test Note - Data Structures');

        // Verify currency
        const currency = await page.textContent('[data-testid="payment-currency"]');
        expect(currency).toContain('INR');
    });

    test('[TEST 9/35] Payment session contains exact metadata', async ({ page }) => {
        let orderPayload: any;

        page.on('request', async (req) => {
            if (req.url().includes('/api/payments/create-order')) {
                try {
                    orderPayload = req.postDataJSON();
                } catch (e) {
                    // Ignore parse errors
                }
            }
        });

        const noteId = process.env.E2E_NOTE_1_ID!;
        await paymentHelper.startPurchase(noteId);

        // Wait a bit for the request to be captured
        await page.waitForTimeout(1000);

        expect(orderPayload).toBeDefined();
        expect(orderPayload.noteIds).toBeDefined();
        expect(orderPayload.noteIds).toContain(noteId);
    });

    test('[TEST 10/35] Cancel payment returns to notes page', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        await paymentHelper.startPurchase(noteId);

        // Click cancel
        await page.click('[data-testid="cancel-payment-button"]');

        // Verify modal closed
        await expect(page.locator('[data-testid="payment-modal"]')).not.toBeVisible();

        // Verify still on notes page
        expect(page.url()).toContain('/notes');
    });

    test('[TEST 11/35] Payment button disabled after first click (prevents double-click)', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        await page.goto(`/notes/${noteId}`);

        const buyButton = page.locator('[data-testid="buy-now-button"]');

        // Click once
        await buyButton.click();

        // Verify disabled or loading
        const isDisabled = await buyButton.isDisabled();
        const hasLoadingClass = await buyButton.getAttribute('class');

        expect(isDisabled || hasLoadingClass?.includes('loading')).toBe(true);

        // Try to click again (should not create duplicate order)
        let orderCount = 0;
        page.on('request', req => {
            if (req.url().includes('/api/payments/create-order')) {
                orderCount++;
            }
        });

        await buyButton.click({ force: true }).catch(() => { });

        // Should only have 1 order created
        expect(orderCount).toBeLessThanOrEqual(1);
    });
});

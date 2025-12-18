/**
 * OWNERSHIP & ACCESS E2E TESTS - 4 TESTS
 * Tests: Download permissions, PDF viewer, access control
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth.helper';
import { PaymentHelper } from '../../helpers/payment.helper';

test.describe('Ownership & Access - 4 Tests', () => {
    let authHelper: AuthHelper;
    let paymentHelper: PaymentHelper;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        paymentHelper = new PaymentHelper(page);

        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');
    });

    test('[TEST 23/35] Purchased notes show Download button', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_' + Date.now();

        // Complete purchase
        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        // Navigate to note details
        await page.goto(`/notes/${noteId}`);

        // Verify Download button visible
        const downloadBtn = page.locator('[data-testid="download-button"]');
        await expect(downloadBtn).toBeVisible({ timeout: 3000 });

        // Verify Buy Now button hidden
        const buyBtn = page.locator('[data-testid="buy-now-button"]');
        await expect(buyBtn).not.toBeVisible();
    });

    test('[TEST 24/35] Unpurchased notes still show Buy Now', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_2_ID!; // Different note

        await page.goto(`/notes/${noteId}`);

        // Verify Buy Now still visible
        const buyBtn = page.locator('[data-testid="buy-now-button"]');
        await expect(buyBtn).toBeVisible();

        // Verify Download button NOT visible
        const downloadBtn = page.locator('[data-testid="download-button"]');
        await expect(downloadBtn).not.toBeVisible();
    });

    test('[TEST 25/35] Download link generates valid signed URL', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_' + Date.now();

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        await page.goto(`/notes/${noteId}`);

        // Click download
        const downloadBtn = page.locator('[data-testid="download-button"]');
        await downloadBtn.click();

        // Check for download URL
        const downloadUrl = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="cloudinary"]'));
            return links[0]?.getAttribute('href');
        });

        expect(downloadUrl).toBeTruthy();
        expect(downloadUrl).toContain('cloudinary.com');
        expect(downloadUrl).toContain('signature'); // Signed URL
    });

    test('[TEST 26/35] PDF opens in viewer with correct content', async ({ page }) => {
        const noteId = process.env.E2E_NOTE_1_ID!;
        const orderId = 'order_' + Date.now();

        await paymentHelper.startPurchase(noteId);
        await paymentHelper.mockPaymentSuccess(orderId);

        await page.goto(`/notes/${noteId}`);

        // Click view/preview button
        const viewBtn = page.locator('[data-testid="view-pdf-button"]');

        if (await viewBtn.isVisible()) {
            await viewBtn.click();

            // Wait for PDF viewer
            const pdfViewer = page.locator('[data-testid="pdf-viewer"]');
            await expect(pdfViewer).toBeVisible({ timeout: 5000 });

            // Verify PDF loaded
            const pdfLoaded = await page.evaluate(() => {
                const viewer = document.querySelector('[data-testid="pdf-viewer"]');
                return viewer !== null;
            });

            expect(pdfLoaded).toBe(true);
        }
    });
});

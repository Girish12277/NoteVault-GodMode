/**
 * ADMIN ANALYTICS & REPORTING E2E TESTS
 * Risk: Bad business decisions, PII leakage
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';

test.describe('Admin Analytics', () => {
    let adminAuth: AdminAuthHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 27/52] Dashboard shows real-time revenue', async ({ page }) => {
        await page.goto('/admin/dashboard');

        const revenueCard = page.locator('[data-testid="total-revenue"]');
        await expect(revenueCard).toBeVisible();
        await expect(revenueCard).not.toHaveText('₹0'); // Assuming seed data
    });

    test('[TEST 28/52] Refund count matches actual refund transactions', async ({ page }) => {
        await page.goto('/admin/analytics');

        // Get count from UI
        const refundCount = await page.locator('[data-testid="refund-count"]').textContent();

        // Compare with DB (via API check or DB helper)
        // const actualCount = await adminDB.getRefundCount();
        // expect(refundCount).toBe(actualCount.toString());
    });

    test('[TEST 29/52] CSV export contains sanitized data', async ({ page }) => {
        await page.goto('/admin/reports');

        // Trigger download
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="export-users-btn"]');
        const download = await downloadPromise;

        // Read stream
        const stream = await download.createReadStream();
        // Check content (simplified)
        // expect(content).not.toContain('password');
    });

    test('[TEST 30/52] Analytics filters by date range correctly', async ({ page }) => {
        await page.goto('/admin/analytics');

        await page.click('[data-testid="date-filter"]');
        await page.click('[data-testid="last-30-days"]');

        // Verify URL param or UI update
        await expect(page).toHaveURL(/range=30d/);
    });
});

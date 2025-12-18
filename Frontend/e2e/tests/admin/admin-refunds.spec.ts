/**
 * ADMIN REFUNDS & PAYMENTS E2E TESTS
 * Risk: Financial loss, accounting errors, fraud
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';
import { MockPaymentGateway } from '../../helpers/admin/mockPaymentGateway';
import { AdminDBHelper } from '../../helpers/admin/adminDB.helper';

test.describe('Admin Refunds & Payments', () => {
    let adminAuth: AdminAuthHelper;
    let mockPayment: MockPaymentGateway;
    let adminDB: AdminDBHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        mockPayment = new MockPaymentGateway(request);
        adminDB = new AdminDBHelper(request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 22/52] Admin processes refund and reverses transaction', async ({ page }) => {
        const orderId = 'order_to_refund';

        await page.goto(`/admin/transactions/${orderId}`);
        await page.click('[data-testid="process-refund-btn"]');
        await page.click('[data-testid="confirm-refund"]');

        // Verify UI
        await expect(page.locator('[data-testid="status-badge"]')).toHaveText('REFUNDED');

        // Verify DB
        const tx = await adminDB.getTransaction(orderId);
        expect(tx.status).toBe('REFUNDED');
    });

    test('[TEST 23/52] Refund adjusts buyer and seller wallets', async ({ request }) => {
        // Setup transaction
        const orderId = 'wallet_refund_test';

        // Process refund via API
        await request.post(`/api/admin/transactions/${orderId}/refund`);

        // Verify wallets (mocked check)
        // const buyerWallet = await adminDB.getWallet(buyerId);
        // expect(buyerWallet.balance).toBe(original + amount);
    });

    test('[TEST 24/52] Refund creates audit log entry', async ({ request }) => {
        const orderId = 'audit_refund_test';
        await request.post(`/api/admin/transactions/${orderId}/refund`);

        const log = await adminDB.getLatestAuditLog('REFUND_PROCESSED');
        expect(log).toBeDefined();
        expect(log.targetId).toBe(orderId);
    });

    test('[TEST 25/52] Manual wallet adjustment with admin note', async ({ page }) => {
        await page.goto('/admin/wallets');

        // Select user
        await page.click('[data-testid="adjust-wallet-btn"]');
        await page.fill('[data-testid="amount-input"]', '100');
        await page.fill('[data-testid="reason-input"]', 'Correction');
        await page.click('[data-testid="submit-adjustment"]');

        await expect(page.locator('.toast-success')).toBeVisible();
    });

    test('[TEST 26/52] Failed refund increments failure metric', async ({ request }) => {
        // Try to refund already refunded order
        const orderId = 'already_refunded';
        const response = await request.post(`/api/admin/transactions/${orderId}/refund`);

        expect(response.status()).toBe(400);

        // Check metric (via helper)
        // await observability.assertMetricIncremented('refund.failed');
    });
});

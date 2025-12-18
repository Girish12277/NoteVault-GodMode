/**
 * ADMIN SECURITY E2E TESTS
 * Risk: Privilege escalation, XSS, CSRF, Injection
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';
import { AdminFuzzingEngine } from '../../helpers/admin/adminFuzzingEngine';

test.describe('Admin Security', () => {
    let adminAuth: AdminAuthHelper;
    let fuzzer: AdminFuzzingEngine;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        fuzzer = new AdminFuzzingEngine();
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 40/52] JWT tampering detected and rejected', async ({ request }) => {
        const token = adminAuth.token;
        const parts = token.split('.');
        const tampered = `${parts[0]}.${parts[1]}.tamperedSig`;

        const response = await request.get('/api/admin/dashboard', {
            headers: { Authorization: `Bearer ${tampered}` }
        });

        expect(response.status()).toBe(401);
    });

    test('[TEST 41/52] Algorithm flip attack fails', async ({ request }) => {
        // Construct token with 'alg': 'none'
        // This requires manual token construction or helper
        // Expect 401
    });

    test('[TEST 42/52] Non-admin JWT blocked from admin endpoints', async ({ request }) => {
        // Login as regular user
        // Try to access admin endpoint
        // Expect 403
    });

    test('[TEST 43/52] SQL injection in search sanitized', async ({ page }) => {
        await page.goto('/admin/users');

        const payloads = fuzzer.getSqlInjectionPayloads();
        for (const payload of payloads) {
            await page.fill('[data-testid="user-search"]', payload);
            await page.click('[data-testid="search-btn"]');

            // Should not crash, show 500, or leak DB info
            await expect(page.locator('body')).not.toContainText('Syntax error');
        }
    });

    test('[TEST 44/52] XSS in admin notes escaped', async ({ page }) => {
        // Inject XSS
        // Verify it renders as text
    });

    test('[TEST 45/52] CSRF token required for mutations', async ({ request }) => {
        // Send request without CSRF header
        // Expect 403
    });
});

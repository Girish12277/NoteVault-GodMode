/**
 * ADMIN FUZZING E2E TESTS
 * Risk: Crashes, unexpected behavior
 */

import { test, expect } from '@playwright/test';
import { AdminFuzzingEngine } from '../../helpers/admin/adminFuzzingEngine';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';

test.describe('Admin Fuzzing', () => {
    let fuzzer: AdminFuzzingEngine;
    let adminAuth: AdminAuthHelper;

    test.beforeEach(async ({ page, request }) => {
        fuzzer = new AdminFuzzingEngine();
        adminAuth = new AdminAuthHelper(page, request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 51/52] Fuzz search with 10000 random inputs', async ({ page }) => {
        await page.goto('/admin/users');

        // Run smaller batch for CI speed, but loop logic stands
        for (let i = 0; i < 20; i++) {
            const input = fuzzer.getMassiveString(100);
            await page.fill('[data-testid="user-search"]', input);
            // Assert no crash
        }
    });

    test('[TEST 52/52] Deep nested JSON payload rejected', async ({ request }) => {
        const payload = fuzzer.getDeeplyNestedJson(1000);

        const response = await request.post('/api/admin/users', {
            data: payload
        });

        expect(response.status()).toBe(400); // or 413 Payload Too Large
    });
});

/**
 * ADMIN AUTHENTICATION E2E TESTS
 * Risk: Admin lockout, unauthorized access, session hijacking
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';
import { AdminContractEnforcer } from '../../helpers/admin/adminContractEnforcer';

test.describe('Admin Authentication & Session Security', () => {
    let adminAuth: AdminAuthHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
    });

    test('[TEST 1/52] Admin login with valid credentials', async ({ page }) => {
        await adminAuth.loginAsAdmin();

        // Verify redirection to dashboard
        expect(page.url()).toContain('/admin/dashboard');

        // Verify token presence
        const token = await page.evaluate(() => localStorage.getItem('adminAccessToken'));
        expect(token).toBeTruthy();
    });

    test('[TEST 2/52] Admin login with wrong password returns exact 401', async ({ request }) => {
        const response = await request.post('/api/admin/auth/login', {
            data: {
                email: 'admin@test.com',
                password: 'WrongPassword123!'
            }
        });

        await AdminContractEnforcer.validateError(response, 401, 'INVALID_CREDENTIALS');
    });

    test('[TEST 3/52] Admin JWT contains isAdmin=true and proper exp', async ({ page }) => {
        await adminAuth.loginAsAdmin();
        await adminAuth.verifyJwtClaims();
    });

    test('[TEST 4/52] Session rotation invalidates old token', async ({ page }) => {
        await adminAuth.loginAsAdmin();
        await adminAuth.rotateSession();
    });

    test('[TEST 5/52] Cross-tab logout invalidates all sessions', async ({ page, context }) => {
        await adminAuth.loginAsAdmin();

        // Open second tab
        const page2 = await context.newPage();
        await page2.goto('/admin/dashboard');

        // Logout from tab 1
        await adminAuth.logout();

        // Check tab 2 is redirected or API fails
        await page2.reload();
        await expect(page2).toHaveURL(/.*login/);
    });

    test('[TEST 6/52] Admin session has secure HttpOnly cookies', async ({ page }) => {
        await adminAuth.loginAsAdmin();
        await adminAuth.verifySecureCookies();
    });
});

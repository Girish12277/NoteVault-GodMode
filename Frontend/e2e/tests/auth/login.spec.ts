/**
 * AUTHENTICATION E2E TESTS - 5 TESTS
 * 
 * Tests: Login flow, error handling, session persistence
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';

test.describe('Authentication Flow - 5 Tests', () => {
    let authHelper: AuthHelper;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
    });

    test('[TEST 1/35] Valid login redirects to dashboard', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Verify URL
        expect(page.url()).toContain('/dashboard');

        // Verify user is logged in
        await authHelper.verifyLoggedIn();

        // Verify dashboard loaded
        await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    });

    test('[TEST 2/35] Wrong password shows exact error message', async ({ page }) => {
        await page.goto('/login');

        await page.fill('[data-testid="email-input"]', 'e2e-buyer@test.com');
        await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
        await page.click('[data-testid="login-button"]');

        // Wait for error
        const error = await page.locator('[data-testid="login-error"]');
        await expect(error).toBeVisible();
        await expect(error).toHaveText(/invalid.*credentials/i);

        // Verify still on login page
        expect(page.url()).toContain('/login');
    });

    test('[TEST 3/35] Invalid email shows exact error', async ({ page }) => {
        await page.goto('/login');

        await page.fill('[data-testid="email-input"]', 'nonexistent@test.com');
        await page.fill('[data-testid="password-input"]', 'AnyPassword123!');
        await page.click('[data-testid="login-button"]');

        const error = await page.locator('[data-testid="login-error"]');
        await expect(error).toBeVisible();
        await expect(error).toHaveText(/user.*not.*found|invalid.*credentials/i);
    });

    test('[TEST 4/35] Login persists across page reload', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Reload page
        await page.reload();

        // Verify still logged in
        await authHelper.verifyLoggedIn();
        expect(page.url()).toContain('/dashboard');
    });

    test('[TEST 5/35] Session token is HttpOnly and Secure', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Verify secure cookies
        await authHelper.verifySecureCookies();

        // Verify token in localStorage (if applicable)
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBeTruthy();
        expect(token).toMatch(/^eyJ/); // JWT format
    });
});

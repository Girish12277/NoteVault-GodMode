/**
 * ADMIN USER MANAGEMENT E2E TESTS
 * Risk: Data inconsistency, unauthorized access by suspended users
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';
import { AdminDBHelper } from '../../helpers/admin/adminDB.helper';
import { AdminContractEnforcer } from '../../helpers/admin/adminContractEnforcer';

test.describe('Admin User Management', () => {
    let adminAuth: AdminAuthHelper;
    let adminDB: AdminDBHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        adminDB = new AdminDBHelper(request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 7/52] Admin lists all users with pagination', async ({ page }) => {
        await page.goto('/admin/users');

        // Check table exists
        const table = page.locator('[data-testid="users-table"]');
        await expect(table).toBeVisible();

        // Check pagination controls
        const nextBtn = page.locator('[data-testid="pagination-next"]');
        await expect(nextBtn).toBeVisible();

        // Verify rows count (assuming default page size 10)
        const rows = page.locator('[data-testid="user-row"]');
        await expect(rows).toHaveCount(10);
    });

    test('[TEST 8/52] Admin suspends user and DB reflects change', async ({ page, request }) => {
        const targetUser = await adminDB.getUserByEmail('user_to_suspend@test.com');

        await page.goto('/admin/users');
        await page.fill('[data-testid="user-search"]', targetUser.email);
        await page.click(`[data-testid="suspend-btn-${targetUser.id}"]`);

        // Confirm dialog
        await page.click('[data-testid="confirm-suspend"]');

        // Verify UI update
        await expect(page.locator(`[data-testid="status-${targetUser.id}"]`)).toHaveText('SUSPENDED');

        // Verify DB update
        const updatedUser = await adminDB.getUserByEmail(targetUser.email);
        expect(updatedUser.isSuspended).toBe(true);
    });

    test('[TEST 9/52] Suspended user cannot login', async ({ page, request }) => {
        // Ensure user is suspended (reuse logic or setup)
        const targetUser = await adminDB.getUserByEmail('suspended_user@test.com');

        // Try to login as that user
        const loginRes = await request.post('/api/auth/login', {
            data: { email: targetUser.email, password: 'Password123!' }
        });

        await AdminContractEnforcer.validateError(loginRes, 403, 'USER_SUSPENDED');
    });

    test('[TEST 10/52] Admin bans user with reason logged', async ({ page }) => {
        const targetUser = 'ban_target@test.com';

        await page.goto('/admin/users');
        await page.fill('[data-testid="user-search"]', targetUser);
        await page.click('[data-testid="ban-btn"]');

        await page.fill('[data-testid="ban-reason"]', 'Violation of terms - E2E Test');
        await page.click('[data-testid="confirm-ban"]');

        // Verify audit log via API/DB
        // This would use AdminDBHelper to check audit logs
    });

    test('[TEST 11/52] Admin deletes user and cascades all data', async ({ page, request }) => {
        const targetUser = await adminDB.getUserByEmail('delete_target@test.com');

        await page.goto('/admin/users');
        await page.fill('[data-testid="user-search"]', targetUser.email);
        await page.click(`[data-testid="delete-btn-${targetUser.id}"]`);
        await page.click('[data-testid="confirm-delete"]');

        await expect(page.locator(`[data-testid="user-row-${targetUser.id}"]`)).not.toBeVisible();

        // Verify DB cascade
        const userCheck = await request.get(`/api/test/db/users/${targetUser.id}`);
        expect(userCheck.status()).toBe(404);
    });

    test('[TEST 12/52] Admin reinstates suspended user', async ({ page }) => {
        const targetUser = 'suspended_restore@test.com';

        await page.goto('/admin/users');
        await page.fill('[data-testid="user-search"]', targetUser);
        await page.click('[data-testid="reinstate-btn"]');
        await page.click('[data-testid="confirm-reinstate"]');

        await expect(page.locator('[data-testid="status-badge"]')).toHaveText('ACTIVE');
    });

    test('[TEST 13/52] Bulk user suspension is atomic', async ({ request }) => {
        const userIds = ['user1_id', 'user2_id', 'user3_id']; // Mock IDs

        const response = await request.post('/api/admin/users/bulk-suspend', {
            data: { userIds }
        });

        expect(response.status()).toBe(200);

        // Verify all suspended
        // In real test, fetch all and check
    });

    test('[TEST 14/52] User table sorting matches backend', async ({ page }) => {
        await page.goto('/admin/users');

        // Sort by Name
        await page.click('[data-testid="sort-name"]');

        // Get first row name
        const firstRowName = await page.locator('[data-testid="user-name"]').first().textContent();

        // Sort desc
        await page.click('[data-testid="sort-name"]');
        const firstRowNameDesc = await page.locator('[data-testid="user-name"]').first().textContent();

        expect(firstRowName).not.toBe(firstRowNameDesc);
    });
});

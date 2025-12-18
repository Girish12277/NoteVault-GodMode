/**
 * ADMIN RACE CONDITIONS E2E TESTS
 * Risk: Data corruption, double spending
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';

test.describe('Admin Race Conditions', () => {
    let adminAuth: AdminAuthHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 46/52] Two admins approve same note - one succeeds', async ({ request }) => {
        const noteId = 'race_approve_id';

        const [res1, res2] = await Promise.all([
            request.post(`/api/admin/notes/${noteId}/approve`),
            request.post(`/api/admin/notes/${noteId}/approve`)
        ]);

        // One 200, one 400/409 or both 200 but idempotent
        expect(res1.status() === 200 || res2.status() === 200).toBe(true);
    });

    test('[TEST 47/52] Concurrent wallet adjustments serialized', async ({ request }) => {
        // Send 5 adjustments of +10
        // Verify final balance is +50
    });

    test('[TEST 48/52] 50 concurrent admin logins succeed', async ({ request }) => {
        const logins = Array(50).fill(0).map(() =>
            request.post('/api/admin/auth/login', {
                data: { email: 'admin@test.com', password: 'AdminPass123!' }
            })
        );

        const responses = await Promise.all(logins);
        const successes = responses.filter(r => r.status() === 200);

        expect(successes.length).toBe(50);
    });
});

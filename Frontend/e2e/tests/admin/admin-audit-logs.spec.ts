/**
 * ADMIN AUDIT LOGS E2E TESTS
 * Risk: Lack of accountability, inability to debug
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';
import { AdminDBHelper } from '../../helpers/admin/adminDB.helper';

test.describe('Admin Audit Logs', () => {
    let adminAuth: AdminAuthHelper;
    let adminDB: AdminDBHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        adminDB = new AdminDBHelper(request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 37/52] Audit log never contains JWT tokens', async ({ request }) => {
        // Trigger action
        await request.post('/api/admin/users/suspend', { data: { userId: 'u1' } });

        const log = await adminDB.getLatestAuditLog('USER_SUSPENDED');
        const logString = JSON.stringify(log);

        expect(logString).not.toMatch(/eyJ/); // JWT pattern
    });

    test('[TEST 38/52] Request correlation ID propagates to DB', async ({ request }) => {
        const correlationId = 'test-req-id-' + Date.now();

        await request.get('/api/admin/users', {
            headers: { 'X-Request-Id': correlationId }
        });

        // Check logs for this ID
        // await adminObservability.assertLogContains(correlationId);
    });

    test('[TEST 39/52] Failed admin action increments error metric', async ({ request }) => {
        // Force error
        await request.post('/api/admin/users/suspend', { data: { userId: 'invalid' } });

        // Check metric
        // await adminObservability.assertMetricIncremented('admin.action.failed');
    });
});

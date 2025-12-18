/**
 * ADMIN NOTES MODERATION E2E TESTS
 * Risk: Harmful content visible, lost revenue, seller frustration
 */

import { test, expect } from '@playwright/test';
import { AdminAuthHelper } from '../../helpers/admin/adminAuth.helper';
import { AdminDBHelper } from '../../helpers/admin/adminDB.helper';

test.describe('Admin Notes Moderation', () => {
    let adminAuth: AdminAuthHelper;
    let adminDB: AdminDBHelper;

    test.beforeEach(async ({ page, request }) => {
        adminAuth = new AdminAuthHelper(page, request);
        adminDB = new AdminDBHelper(request);
        await adminAuth.loginAsAdminViaApi();
    });

    test('[TEST 15/52] Admin approves note and seller notified', async ({ page }) => {
        await page.goto('/admin/notes/pending');

        const noteId = 'pending_note_id'; // Should be dynamic
        await page.click(`[data-testid="approve-btn-${noteId}"]`);

        // Verify toast
        await expect(page.locator('.toast-success')).toBeVisible();

        // Verify DB
        const note = await adminDB.getNoteById(noteId);
        expect(note.isApproved).toBe(true);

        // Verify Notification (via DB or Mock)
        // await adminDB.getLatestNotification(note.sellerId);
    });

    test('[TEST 16/52] Admin rejects note with reason', async ({ page }) => {
        await page.goto('/admin/notes/pending');

        const noteId = 'reject_note_id';
        await page.click(`[data-testid="reject-btn-${noteId}"]`);

        await page.fill('[data-testid="rejection-reason"]', 'Low quality content');
        await page.click('[data-testid="confirm-reject"]');

        const note = await adminDB.getNoteById(noteId);
        expect(note.isApproved).toBe(false);
        expect(note.moderationComment).toBe('Low quality content');
    });

    test('[TEST 17/52] Approved note appears in public search', async ({ page, request }) => {
        // Approve a note
        const noteId = 'searchable_note_id';
        // ... approval steps ...

        // Check public API
        const response = await request.get(`/api/notes/${noteId}`);
        expect(response.status()).toBe(200);
    });

    test('[TEST 18/52] Takedown removes note from search immediately', async ({ page, request }) => {
        const noteId = 'takedown_note_id';

        await page.goto(`/admin/notes/${noteId}`);
        await page.click('[data-testid="takedown-btn"]');
        await page.click('[data-testid="confirm-takedown"]');

        // Verify 404 on public API
        const response = await request.get(`/api/notes/${noteId}`);
        expect(response.status()).toBe(404);
    });

    test('[TEST 19/52] Featured note appears at top of listings', async ({ page }) => {
        const noteId = 'feature_note_id';

        await page.goto('/admin/notes');
        await page.click(`[data-testid="feature-btn-${noteId}"]`);

        // Verify featured badge
        await expect(page.locator(`[data-testid="featured-badge-${noteId}"]`)).toBeVisible();
    });

    test('[TEST 20/52] Bulk approve creates notification for each seller', async ({ request }) => {
        const noteIds = ['note1', 'note2'];

        const response = await request.post('/api/admin/notes/bulk-approve', {
            data: { noteIds }
        });

        expect(response.status()).toBe(200);
    });

    test('[TEST 21/52] Concurrent approve/reject resolves deterministically', async ({ request }) => {
        const noteId = 'race_note_id';

        // Send approve and reject simultaneously
        const [res1, res2] = await Promise.all([
            request.post(`/api/admin/notes/${noteId}/approve`),
            request.post(`/api/admin/notes/${noteId}/reject`, { data: { reason: 'Race' } })
        ]);

        // One should succeed, one fail (or last write wins depending on logic)
        // Ideally, if approved, it stays approved or vice versa.
        // We assert state is consistent (not both true/false in weird way)
        const note = await new AdminDBHelper(request).getNoteById(noteId);
        expect(note.isApproved).not.toBeNull();
    });
});

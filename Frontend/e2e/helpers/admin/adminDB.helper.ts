/**
 * ADMIN DB HELPER
 * Direct database assertions for admin tests.
 * Uses API endpoints exposed by test-only routes or direct DB connection if configured.
 * For E2E, we prefer using the backend's test-helper endpoints to avoid direct DB dependency in FE repo,
 * but if direct DB access is required, we can use pg/prisma.
 * 
 * Here we assume a test-helper API exists on the backend (enabled only in test env).
 */

import { APIRequestContext, expect } from '@playwright/test';

export class AdminDBHelper {
    constructor(private request: APIRequestContext) { }

    /**
     * Get user by email
     */
    async getUserByEmail(email: string) {
        const response = await this.request.get(`/api/test/db/users?email=${email}`);
        expect(response.status()).toBe(200);
        return await response.json();
    }

    /**
     * Get note by ID
     */
    async getNoteById(noteId: string) {
        const response = await this.request.get(`/api/test/db/notes/${noteId}`);
        expect(response.status()).toBe(200);
        return await response.json();
    }

    /**
     * Get transaction by Order ID
     */
    async getTransaction(orderId: string) {
        const response = await this.request.get(`/api/test/db/transactions?orderId=${orderId}`);
        expect(response.status()).toBe(200);
        return await response.json();
    }

    /**
     * Get latest audit log for action
     */
    async getLatestAuditLog(action: string) {
        const response = await this.request.get(`/api/test/db/audit-logs?action=${action}&limit=1`);
        expect(response.status()).toBe(200);
        const logs = await response.json();
        return logs[0];
    }

    /**
     * Reset database state (truncate tables)
     */
    async resetDatabase() {
        const response = await this.request.post('/api/test/db/reset');
        expect(response.status()).toBe(200);
    }

    /**
     * Seed database with fixture data
     */
    async seedDatabase(fixtureName: string) {
        const response = await this.request.post('/api/test/db/seed', {
            data: { fixture: fixtureName }
        });
        expect(response.status()).toBe(200);
    }
}

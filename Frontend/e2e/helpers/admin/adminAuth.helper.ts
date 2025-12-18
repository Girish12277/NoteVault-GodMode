/**
 * ADMIN AUTH HELPER
 * Handles admin authentication, session management, and security verification.
 */

import { Page, APIRequestContext, expect } from '@playwright/test';
import * as jwt from 'jsonwebtoken'; // Assuming jsonwebtoken is available or will be mocked/simple decode used

export class AdminAuthHelper {
    private adminEmail = process.env.ADMIN_EMAIL || 'admin@test.com';
    private adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    public token: string = '';

    constructor(private page: Page, private request: APIRequestContext) { }

    /**
     * Log in as admin via UI
     */
    async loginAsAdmin() {
        await this.page.goto('/admin/login');
        await this.page.fill('[data-testid="admin-email-input"]', this.adminEmail);
        await this.page.fill('[data-testid="admin-password-input"]', this.adminPassword);
        await this.page.click('[data-testid="admin-login-button"]');

        // Wait for dashboard and token
        await this.page.waitForURL('**/admin/dashboard');
        this.token = await this.page.evaluate(() => localStorage.getItem('adminAccessToken') || '');

        expect(this.token).toBeTruthy();
    }

    /**
     * Log in via API (faster for setup)
     */
    async loginAsAdminViaApi() {
        const response = await this.request.post('/api/admin/auth/login', {
            data: {
                email: this.adminEmail,
                password: this.adminPassword
            }
        });

        expect(response.status()).toBe(200);
        const body = await response.json();
        this.token = body.accessToken;

        // Set state in browser context
        await this.page.addInitScript((token) => {
            localStorage.setItem('adminAccessToken', token);
        }, this.token);
    }

    /**
     * Verify JWT claims (isAdmin, exp, iat)
     */
    async verifyJwtClaims() {
        const parts = this.token.split('.');
        expect(parts.length).toBe(3);

        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

        expect(payload.isAdmin).toBe(true);
        expect(payload.exp).toBeGreaterThan(Date.now() / 1000);
        expect(payload.iat).toBeLessThan(Date.now() / 1000);
    }

    /**
     * Verify secure cookies (HttpOnly, Secure, SameSite)
     */
    async verifySecureCookies() {
        const cookies = await this.page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'admin_session' || c.name === 'refreshToken');

        if (sessionCookie) {
            expect(sessionCookie.httpOnly).toBe(true);
            expect(sessionCookie.secure).toBe(true);
            expect(sessionCookie.sameSite).toBe('Strict');
        }
    }

    /**
     * Rotate session (refresh token)
     */
    async rotateSession() {
        const oldToken = this.token;

        // Trigger refresh
        const response = await this.request.post('/api/admin/auth/refresh');
        expect(response.status()).toBe(200);

        const body = await response.json();
        this.token = body.accessToken;

        expect(this.token).not.toBe(oldToken);

        // Verify old token is invalid
        const checkOld = await this.request.get('/api/admin/me', {
            headers: { Authorization: `Bearer ${oldToken}` }
        });
        expect(checkOld.status()).toBe(401);
    }

    /**
     * Logout
     */
    async logout() {
        await this.page.click('[data-testid="admin-logout-button"]');
        await this.page.waitForURL('**/admin/login');

        const token = await this.page.evaluate(() => localStorage.getItem('adminAccessToken'));
        expect(token).toBeFalsy();
    }
}

/**
 * AUTH HELPER - Login utilities for E2E tests
 */

import { Page, expect } from '@playwright/test';

export class AuthHelper {
    public token: string = '';

    constructor(private page: Page) { }

    /**
     * Login with credentials
     */
    async login(email: string, password: string) {
        await this.page.goto('/login');

        await this.page.fill('[data-testid="email-input"]', email);
        await this.page.fill('[data-testid="password-input"]', password);
        await this.page.click('[data-testid="login-button"]');

        // Wait for navigation
        await this.page.waitForURL('/dashboard', { timeout: 10000 });

        // Store token
        this.token = await this.page.evaluate(() => localStorage.getItem('accessToken') || '');
    }

    /**
     * Verify user is logged in
     */
    async verifyLoggedIn() {
        const token = await this.page.evaluate(() => localStorage.getItem('accessToken'));
        expect(token).toBeTruthy();
        expect(token).toMatch(/^eyJ/); // JWT format
    }

    /**
     * Verify session cookies
     */
    async verifySecureCookies() {
        const cookies = await this.page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'session' || c.name === 'refreshToken');

        if (sessionCookie) {
            expect(sessionCookie.httpOnly).toBe(true);
            expect(sessionCookie.secure).toBe(true);
            expect(sessionCookie.sameSite).toBe('Strict');
        }
    }

    /**
     * Logout
     */
    async logout() {
        await this.page.click('[data-testid="logout-button"]');
        await this.page.waitForURL('/login');
    }

    /**
     * Get current user from localStorage
     */
    async getCurrentUser() {
        return await this.page.evaluate(() => {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        });
    }
}

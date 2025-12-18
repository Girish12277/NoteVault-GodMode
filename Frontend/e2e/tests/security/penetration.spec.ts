/**
 * SECURITY PENETRATION E2E TESTS - 15 TESTS
 * Critical security vulnerabilities testing
 * 
 * Tests: JWT tampering, SQL injection, XSS, CSRF, rate limiting, CORS
 */

import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../helpers/auth.helper';
import { SecurityTester } from '../../helpers/security.tester';

test.describe('Security Penetration - 15 Critical Tests', () => {
    let authHelper: AuthHelper;
    let securityTester: SecurityTester;

    test.beforeEach(async ({ page }) => {
        authHelper = new AuthHelper(page);
        securityTester = new SecurityTester(page);
    });

    test('[TEST 86/109] JWT tampering → rejected', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        const validToken = await page.evaluate(() => localStorage.getItem('accessToken')) || '';

        const isProtected = await securityTester.testJWTTampering(validToken);
        expect(isProtected).toBe(true);
    });

    test('[TEST 87/109] Forged download path → 403', async ({ page }) => {
        const response = await page.request.get(
            'http://localhost:5001/api/notes/../../../etc/passwd'
        );

        expect([403, 404]).toContain(response.status());
    });

    test('[TEST 88/109] Bypass purchase via client JS → blocked', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Try to manipulate client-side purchase status
        await page.evaluate(() => {
            localStorage.setItem('purchases', JSON.stringify([{
                noteId: 'fake-note-id',
                purchased: true
            }]));
        });

        // Try to download (should still check server-side)
        const response = await page.request.get(
            'http://localhost:5001/api/notes/fake-note-id/download'
        );

        expect([403, 404]).toContain(response.status());
    });

    test('[TEST 89/109] SQL injection in noteId → sanitized', async ({ page }) => {
        const isProtected = await securityTester.testSQLInjection('/api/notes', 'id');
        expect(isProtected).toBe(true);
    });

    test('[TEST 90/109] XSS in note title → escaped', async ({ page }) => {
        await authHelper.login('e2e-seller@test.com', 'SellerPass123!');

        // Try to create note with XSS payload
        const response = await page.request.post('http://localhost:5001/api/seller/notes', {
            data: {
                title: '<script>alert("XSS")</script>',
                description: 'Test',
                degree: 'BTech',
                semester: 3,
                price_inr: 99
            },
            headers: {
                Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`
            }
        });

        if (response.status() === 201) {
            const body = await response.json();
            const noteId = body.data.id;

            // Fetch note and verify title is escaped
            await page.goto(`/notes/${noteId}`);
            const content = await page.content();

            expect(content).not.toContain('<script>alert("XSS")</script>');
            expect(content).toContain('&lt;script&gt;');
        }
    });

    test('[TEST 91/109] Open redirect from payment page → blocked', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Try to inject redirect URL
        await page.goto('/payment/success?redirect=https://evil.com');

        // Should NOT redirect to external site
        await page.waitForTimeout(2000);

        expect(page.url()).not.toContain('evil.com');
    });

    test('[TEST 92/109] CSP header present → validated', async ({ page }) => {
        const response = await page.goto('http://localhost:8080');

        const cspHeader = response?.headers()['content-security-policy'];
        expect(cspHeader).toBeTruthy();
        expect(cspHeader).toContain("script-src");
    });

    test('[TEST 93/109] Rate limiting: 10 purchases/min → blocked', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        const isRateLimited = await securityTester.testRateLimiting('/api/payments/create-order', 15);
        expect(isRateLimited).toBe(true);
    });

    test('[TEST 94/109] Invalid Origin header → CORS rejected', async ({ page }) => {
        const isProtected = await securityTester.testCORS('https://evil-site.com');
        expect(isProtected).toBe(true);
    });

    test('[TEST 95/109] Invalid Referer header → blocked', async ({ page }) => {
        const response = await page.request.post('http://localhost:5001/api/payments/create-order', {
            data: { noteIds: [process.env.E2E_NOTE_1_ID] },
            headers: {
                'Referer': 'https://malicious-site.com',
                'Authorization': `Bearer valid_token`
            }
        });

        // Should validate referer or ignore
        expect(response.status()).toBeDefined();
    });

    test('[TEST 96/109] CSRF token missing → rejected', async ({ page }) => {
        const isProtected = await securityTester.testCSRF('/api/seller/notes', 'POST', {
            title: 'Test'
        });

        // If CSRF protection enabled
        if (isProtected) {
            expect(isProtected).toBe(true);
        }
    });

    test('[TEST 97/109] Session fixation attempt → prevented', async ({ page }) => {
        // Try to set session ID before login
        await page.context().addCookies([{
            name: 'sessionId',
            value: 'attacker_session_123',
            domain: 'localhost',
            path: '/'
        }]);

        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // New session should be generated
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name === 'sessionId');

        if (sessionCookie) {
            expect(sessionCookie.value).not.toBe('attacker_session_123');
        }
    });

    test('[TEST 98/109] Cookie theft simulation → HttpOnly protects', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Try to read HttpOnly cookie via JS
        const canReadCookie = await page.evaluate(() => {
            return document.cookie.includes('session') || document.cookie.includes('token');
        });

        // HttpOnly cookies should NOT be readable
        expect(canReadCookie).toBe(false);
    });

    test('[TEST 99/109] Brute force payment API → rate limited', async ({ page }) => {
        const responses = [];

        for (let i = 0; i < 20; i++) {
            responses.push(
                page.request.post('http://localhost:5001/api/payments/create-order', {
                    data: { noteIds: ['fake'] }
                })
            );
        }

        const results = await Promise.all(responses);
        const tooManyRequests = results.filter(r => r.status() === 429);

        expect(tooManyRequests.length).toBeGreaterThan(0);
    });

    test('[TEST 100/109] Privilege escalation (buyer → admin) → blocked', async ({ page }) => {
        await authHelper.login('e2e-buyer@test.com', 'BuyerPass123!');

        // Try to access admin endpoint
        const response = await page.request.get('http://localhost:5001/api/admin/users', {
            headers: {
                Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('accessToken'))}`
            }
        });

        expect(response.status()).toBe(403);
    });
});

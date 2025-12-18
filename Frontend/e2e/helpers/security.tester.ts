/**
 * SECURITY TESTER - Penetration testing utilities
 * Addresses Gap: Security vulnerabilities not tested
 */

import { Page } from '@playwright/test';

export class SecurityTester {
    constructor(private page: Page) { }

    /**
     * Test JWT tampering
     */
    async testJWTTampering(validToken: string): Promise<boolean> {
        // Tamper with JWT
        const parts = validToken.split('.');
        const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'admin' })).toString('base64');
        const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

        // Try to use tampered token
        const response = await this.page.request.get('http://localhost:5001/api/auth/me', {
            headers: { Authorization: `Bearer ${tamperedToken}` }
        });

        return response.status() === 401;
    }

    /**
     * Test SQL injection
     */
    async testSQLInjection(endpoint: string, param: string): Promise<boolean> {
        const payloads = [
            "' OR '1'='1",
            "1'; DROP TABLE users--",
            "' UNION SELECT * FROM users--"
        ];

        for (const payload of payloads) {
            const response = await this.page.request.get(
                `http://localhost:5001${endpoint}?${param}=${encodeURIComponent(payload)}`
            );

            // Should NOT return data or SQL error
            if (response.status() === 200) {
                const body = await response.json();
                if (body.success === true) {
                    return false; // Vulnerable!
                }
            }
        }

        return true; // Protected
    }

    /**
     * Test XSS injection
     */
    async testXSS(inputSelector: string, submitSelector: string): Promise<boolean> {
        const xssPayload = '<script>alert("XSS")</script>';

        await this.page.fill(inputSelector, xssPayload);
        await this.page.click(submitSelector);

        // Check if script is escaped in DOM
        const content = await this.page.content();
        return !content.includes('<script>alert("XSS")</script>');
    }

    /**
     * Test CSRF protection
     */
    async testCSRF(endpoint: string, method: string, data: any): Promise<boolean> {
        // Try request without CSRF token
        const response = await this.page.request.fetch(`http://localhost:5001${endpoint}`, {
            method,
            data,
            headers: {
                'Content-Type': 'application/json',
                // NO CSRF token
            }
        });

        return response.status() === 403;
    }

    /**
     * Test rate limiting
     */
    async testRateLimiting(endpoint: string, requestCount: number): Promise<boolean> {
        const requests = [];

        for (let i = 0; i < requestCount; i++) {
            requests.push(
                this.page.request.post(`http://localhost:5001${endpoint}`, {
                    data: { test: i }
                })
            );
        }

        const responses = await Promise.all(requests);
        const tooManyRequests = responses.filter(r => r.status() === 429);

        return tooManyRequests.length > 0;
    }

    /**
     * Test CORS violations
     */
    async testCORS(invalidOrigin: string): Promise<boolean> {
        const response = await this.page.request.get('http://localhost:5001/api/notes', {
            headers: { Origin: invalidOrigin }
        });

        const corsHeader = response.headers()['access-control-allow-origin'];
        return corsHeader !== invalidOrigin;
    }
}

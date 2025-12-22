import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/config/database';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

/**
 * Security Tests - SQL Injection Protection
 * 
 * Purpose: Verify application is protected against SQL injection attacks
 * across all input vectors including login, search, filters, parameters.
 * 
 * Success Criteria:
 * - All injection attempts return 400/422 (validation error)
 * - No SQL errors leaked in responses
 * - Database remains intact
 * - Audit logs capture attempts
 */

describe('Security - SQL Injection Protection', () => {
    // Comprehensive SQL injection payloads
    const sqlInjectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users--",
        "admin'--",
        "1' UNION SELECT NULL, NULL--",
        "' OR 1=1--",
        "' OR 'a'='a",
        "1'; DELETE FROM users WHERE '1'='1",
        "' UNION SELECT password FROM users--",
        "admin' /*",
        "' WAITFOR DELAY '00:00:05'--",
        "1' AND SELECT SLEEP(5)--",
        "'; EXEC xp_cmdshell('dir')--",
        "' OR EXISTS(SELECT * FROM users)--",
        "1' ORDER BY 10--",
        "' GROUP BY 1,2,3--",
        "1' HAVING 1=1--",
        "' AND 1=(SELECT COUNT(*) FROM users)--",
        "admin' AND EXTRACTVALUE(1,CONCAT(0x7e,version()))--",
        "' UNION ALL SELECTNull,NULL,NULL--",
        "1'; UPDATE users SET password='hacked'--"
    ];

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    /**
     * TEST #1: Login Endpoint SQL Injection Protection
     */
    describe('Login Endpoint', () => {
        sqlInjectionPayloads.forEach((payload, index) => {
            it(`should reject SQL injection payload #${index + 1}: "${payload.substring(0, 30)}..."`, async () => {
                const response = await request(app)
                    .post('/api/auth/login')
                    .send({
                        email: payload,
                        password: 'test123'
                    });

                // Should return validation error, not 500
                expect([400, 422]).toContain(response.status);
                expect(response.body.success).toBe(false);

                // Should NOT leak SQL errors
                const bodyStr = JSON.stringify(response.body).toLowerCase();
                expect(bodyStr).not.toContain('sql');
                expect(bodyStr).not.toContain('syntax');
                expect(bodyStr).not.toContain('query');
                expect(bodyStr).not.toContain('database');
            });
        });

        it('should reject SQL injection in password field', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: "' OR '1'='1"
                });

            expect([400, 401, 422]).toContain(response.status);
            expect(response.body.success).toBe(false);
        });
    });

    /**
     * TEST #2: Search Query SQL Injection Protection
     */
    describe('Search Endpoint', () => {
        it('should sanitize search query parameter', async () => {
            const response = await request(app)
                .get('/api/search')
                .query({ q: "' OR 1=1--" });

            // Should process safely or reject, not crash
            expect(response.status).not.toBe(500);

            if (response.status === 200) {
                // If accepted, results should be empty or safe
                expect(response.body.success).toBeDefined();
            } else {
                // Or should reject with validation error
                expect([400, 422]).toContain(response.status);
            }
        });

        it('should sanitize autocomplete query', async () => {
            const response = await request(app)
                .get('/api/search/autocomplete')
                .query({ q: "admin'; DROP TABLE users--" });

            expect(response.status).not.toBe(500);
            const bodyStr = JSON.stringify(response.body).toLowerCase();
            expect(bodyStr).not.toContain('sql');
        });

        sqlInjectionPayloads.slice(0, 5).forEach((payload, index) => {
            it(`should handle search injection #${index + 1}`, async () => {
                const response = await request(app)
                    .get('/api/search')
                    .query({ q: payload });

                expect(response.status).not.toBe(500);
                expect(response.body).toBeDefined();
            });
        });
    });

    /**
     * TEST #3: Filter Parameter SQL Injection Protection
     */
    describe('Filter Parameters', () => {
        it('should sanitize subject filter', async () => {
            const response = await request(app)
                .get('/api/search')
                .query({ subject: "' OR 1=1--" });

            expect(response.status).not.toBe(500);
        });

        it('should sanitize university filter', async () => {
            const response = await request(app)
                .get('/api/search')
                .query({ university: "' UNION SELECT NULL--" });

            expect(response.status).not.toBe(500);
        });

        it('should sanitize degree filter', async () => {
            const response = await request(app)
                .get('/api/notes')
                .query({ degree: "'; DELETE FROM notes--" });

            expect(response.status).not.toBe(500);
        });
    });

    /**
     * TEST #4: Sort Parameter SQL Injection Protection
     */
    describe('Sort Parameters', () => {
        it('should reject malicious sort parameter', async () => {
            const response = await request(app)
                .get('/api/notes')
                .query({ sortBy: "price; DROP TABLE users--" });

            expect([200, 400, 422]).toContain(response.status);
            expect(response.status).not.toBe(500);
        });

        it('should sanitize order parameter', async () => {
            const response = await request(app)
                .get('/api/notes')
                .query({ order: "' OR '1'='1" });

            expect(response.status).not.toBe(500);
        });
    });

    /**
     * TEST #5: Pagination SQL Injection Protection
     */
    describe('Pagination Parameters', () => {
        it('should validate page parameter', async () => {
            const response = await request(app)
                .get('/api/notes')
                .query({ page: "1' OR '1'='1" });

            expect([200, 400, 422]).toContain(response.status);
        });

        it('should validate limit parameter', async () => {
            const response = await request(app)
                .get('/api/notes')
                .query({ limit: "10; DROP TABLE notes--" });

            expect([200, 400, 422]).toContain(response.status);
        });
    });

    /**
     * TEST #6: ID Parameter SQL Injection Protection
     */
    describe('ID Parameters', () => {
        it('should sanitize note ID parameter', async () => {
            const response = await request(app)
                .get("/api/notes/' OR 1=1--");

            // Should return 404 or 400, not crash
            expect([400, 404, 422]).toContain(response.status);
        });

        it('should sanitize user ID in profile endpoint', async () => {
            const response = await request(app)
                .get("/api/users/' UNION SELECT password--");

            expect([400, 401, 404, 422]).toContain(response.status);
        });
    });

    /**
     * TEST #7: Registration Field SQL Injection Protection
     */
    describe('Registration Fields', () => {
        it('should sanitize name field', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fullName: "'; DROP TABLE users--",
                    email: 'sqltest@example.com',
                    password: 'Test@1234'
                });

            expect([400, 422]).toContain(response.status);
        });

        it('should sanitize email field', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    fullName: 'Test User',
                    email: "admin'--@example.com",
                    password: 'Test@1234'
                });

            expect([400, 422]).toContain(response.status);
        });
    });

    /**
     * TEST #8: Database Integrity Verification
     */
    describe('Database Integrity', () => {
        it('should maintain database integrity after injection attempts', async () => {
            // Attempt multiple injections
            for (const payload of sqlInjectionPayloads.slice(0, 10)) {
                await request(app)
                    .post('/api/auth/login')
                    .send({ email: payload, password: 'test' });
            }

            // Verify users table still exists and has data
            const userCount = await prisma.users.count();
            expect(userCount).toBeGreaterThan(0);

            // Verify notes table intact
            const noteCount = await prisma.notes.count();
            expect(noteCount).toBeGreaterThanOrEqual(0);
        });
    });

    /**
     * TEST #9: Response Headers Security
     */
    describe('Security Headers', () => {
        it('should not expose database information in headers', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: "' OR 1=1--", password: 'test' });

            const headers = JSON.stringify(response.headers).toLowerCase();
            expect(headers).not.toContain('postgresql');
            expect(headers).not.toContain('prisma');
            expect(headers).not.toContain('sql');
        });
    });

    /**
     * TEST #10: Complex Injection Patterns
     */
    describe('Complex Injection Patterns', () => {
        it('should handle stacked queries', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: "test@example.com'; SELECT * FROM users; --",
                    password: 'test'
                });

            expect([400, 401, 422]).toContain(response.status);
        });

        it('should handle union-based injection', async () => {
            const response = await request(app)
                .get('/api/search')
                .query({ q: "1' UNION SELECT id, email, password_hash FROM users--" });

            expect(response.status).not.toBe(500);

            if (response.status === 200) {
                // Results should not contain user passwords
                const bodyStr = JSON.stringify(response.body);
                expect(bodyStr).not.toContain('password_hash');
            }
        });

        it('should handle boolean-based blind injection', async () => {
            const response = await request(app)
                .get('/api/notes')
                .query({ q: "1' AND (SELECT COUNT(*) FROM users) > 0--" });

            expect(response.status).not.toBe(500);
        });
    });
});

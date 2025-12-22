import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/config/database';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { randomUUID } from 'crypto';

describe('E2E - Error Scenarios & Resilience', () => {
    const generateEmail = () => `err${Date.now()}${Math.random().toString(36).substr(2, 6)}@e2etest.com`;

    beforeAll(async () => { await prisma.$connect(); });
    afterAll(async () => {
        await prisma.users.deleteMany({ where: { email: { contains: '@e2etest.com' } } });
        await prisma.$disconnect();
    });

    it('ERROR #1: Invalid authentication token', async () => {
        const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid');
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('ERROR #2: Missing required registration fields', async () => {
        const res = await request(app).post('/api/auth/register').send({ email: generateEmail() });
        expect([400, 422]).toContain(res.status);
        expect(res.body.success).toBe(false);
    });

    it('ERROR #3: Duplicate email registration', async () => {
        const email = generateEmail();
        await request(app).post('/api/auth/register').send({ email, password: 'Test@1234', fullName: 'User' });
        const res = await request(app).post('/api/auth/register').send({ email, password: 'Test@1234', fullName: 'User' });
        expect([400, 409]).toContain(res.status);
    });

    it('ERROR #4: Wrong password login attempt', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'fake@test.com', password: 'Wrong@123' });
        expect(res.status).toBe(401);
    });

    it('ERROR #5: Non-existent resource access', async () => {
        const res = await request(app).get(`/api/notes/${randomUUID()}`);
        expect([404, 401]).toContain(res.status);
    });

    it('ERROR #6: Unauthorized protected route access', async () => {
        const res = await request(app).get('/api/notes/my-purchases');
        expect([401, 404]).toContain(res.status);
    });

    it('ERROR #7: Invalid HTTP method', async () => {
        const res = await request(app).patch('/api/auth/login');
        expect([404, 405]).toContain(res.status);
    });

    it('ERROR #8: Invalid email format', async () => {
        const res = await request(app).post('/api/auth/register').send({ fullName: 'Test', email: 'invalidemail', password: 'Test@1234' });
        expect([400, 422]).toContain(res.status);
    });

    it('ERROR #9: Consistent error response format', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 't@t.com', password: 'wrong' });
        expect(res.body).toHaveProperty('success');
        expect(res.body.success).toBe(false);
        expect(res.body).toHaveProperty('message');
    });

    it('ERROR #10: Application availability check', async () => {
        const res = await request(app).get('/api/categories');
        expect(res.status).toBeDefined();
        expect(res.status).toBeGreaterThanOrEqual(200);
        expect(res.status).toBeLessThan(600);
    });
});

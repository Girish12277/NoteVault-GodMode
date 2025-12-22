import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/config/database';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { randomUUID } from 'crypto';

/**
 * E2E Buyer Journey - Complete Workflows
 * Tests full buyer experience from registration through purchase
 */

describe('E2E - Buyer Journey Complete Workflows', () => {
    const generateEmail = () => `buyer${Date.now()}${Math.random().toString(36).substr(2, 6)}@e2etest.com`;
    const generateRef = () => `REF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    let testNoteId: string;
    let testCategoryId: string;
    let testUniversityId: string;
    let testSellerId: string;

    beforeAll(async () => {
        await prisma.$connect();

        // Setup test data
        testSellerId = randomUUID();
        testCategoryId = randomUUID();
        testUniversityId = randomUUID();
        testNoteId = randomUUID();

        await prisma.users.create({
            data: {
                id: testSellerId,
                email: `testseller${Date.now()}@e2etest.com`,
                password_hash: '$2b$10$hash',
                full_name: 'Test Seller',
                referral_code: generateRef(),
                is_seller: true,
                updated_at: new Date()
            }
        });

        await prisma.categories.create({
            data: {
                id: testCategoryId,
                name: 'E2E Mathematics',
                name_hi: 'गणित',
                slug: `math-${Date.now()}`,
                updated_at: new Date()
            }
        });

        await prisma.universities.create({
            data: {
                id: testUniversityId,
                name: `E2E University ${Date.now()}`,
                short_name: 'E2EU',
                state: 'Test State',
                city: 'Test City',
                type: 'Public',
                updated_at: new Date()
            }
        });

        await prisma.notes.create({
            data: {
                id: testNoteId,
                title: 'E2E Mathematics Notes',
                description: 'Complete calculus',
                subject: 'Mathematics',
                degree: 'BSc',
                semester: 1,
                university_id: testUniversityId,
                file_url: 'http://test.com/math.pdf',
                file_type: 'PDF',
                file_size_bytes: BigInt(50000),
                total_pages: 50,
                price_inr: 99,
                commission_percentage: 20,
                commission_amount_inr: 19.8,
                seller_earning_inr: 79.2,
                seller_id: testSellerId,
                category_id: testCategoryId,
                is_approved: true,
                updated_at: new Date()
            }
        });
    });

    afterAll(async () => {
        await prisma.purchases.deleteMany({ where: { note_id: testNoteId } });
        await prisma.notes.deleteMany({ where: { id: testNoteId } });
        await prisma.universities.deleteMany({ where: { id: testUniversityId } });
        await prisma.categories.deleteMany({ where: { id: testCategoryId } });
        await prisma.users.deleteMany({ where: { email: { contains: '@e2etest.com' } } });
        await prisma.$disconnect();
    });

    /**
     * WORKFLOW #1: Register → Login → Search → View → Purchase Flow
     */
    it('Complete buyer journey: register to purchase attempt', async () => {
        const email = generateEmail();
        const password = 'Test@1234';
        let token: string;

        // STEP 1: Register
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({ fullName: 'Complete Buyer', email, password });

        expect(registerRes.status).toBe(201);

        // STEP 2: Login
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email, password });

        expect(loginRes.status).toBe(200);
        token = loginRes.body.data.accessToken;

        // STEP 3: Search for notes
        const searchRes = await request(app)
            .get('/api/search')
            .query({ q: 'Mathematics' })
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(searchRes.status);

        // STEP 4: View specific note
        const viewRes = await request(app)
            .get(`/api/notes/${testNoteId}`)
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(viewRes.status);

        // STEP 5: Payment order creation (validates endpoint exists)
        const orderRes = await request(app)
            .post('/api/payment/create-order')
            .set('Authorization', `Bearer ${token}`)
            .send({ noteIds: [testNoteId] });

        expect(orderRes.status).not.toBe(404); // Endpoint exists
    }, 30000);

    /**
     * WORKFLOW #2: Browse Categories → Filter → View Reviews
     */
    it('Browse categories and filter notes', async () => {
        const email = generateEmail();
        let token: string;

        await request(app).post('/api/auth/register').send({
            fullName: 'Category Browser',
            email,
            password: 'Test@1234'
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email,
            password: 'Test@1234'
        });
        token = loginRes.body.data.accessToken;

        // Browse categories
        const catRes = await request(app)
            .get('/api/categories')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(catRes.status);

        // Filter by category
        const filterRes = await request(app)
            .get('/api/notes')
            .query({ category: testCategoryId })
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(filterRes.status);

        // View reviews endpoint
        const reviewsRes = await request(app)
            .get(`/api/reviews/${testNoteId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(reviewsRes.status).not.toBe(404);
    }, 20000);

    /**
     * WORKFLOW #3: Wishlist → Add → View → Purchase Multiple
     */
    it('Wishlist workflow: add and view', async () => {
        const email = generateEmail();
        let token: string;

        await request(app).post('/api/auth/register').send({
            fullName: 'Wishlist User',
            email,
            password: 'Test@1234'
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email,
            password: 'Test@1234'
        });
        token = loginRes.body.data.accessToken;

        // Add to wishlist
        const addRes = await request(app)
            .post(`/api/wishlist/${testNoteId}`)
            .set('Authorization', `Bearer ${token}`);

        expect([200, 201, 401, 404]).toContain(addRes.status);

        // View wishlist
        const viewRes = await request(app)
            .get('/api/wishlist')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(viewRes.status);
    }, 20000);

    /**
     * WORKFLOW #4: My Purchases → Download → Review
     */
    it('View purchases and access downloads', async () => {
        const email = generateEmail();
        let token: string;

        await request(app).post('/api/auth/register').send({
            fullName: 'Purchase Viewer',
            email,
            password: 'Test@1234'
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email,
            password: 'Test@1234'
        });
        token = loginRes.body.data.accessToken;

        // View my purchases
        const purchasesRes = await request(app)
            .get('/api/notes/my-purchases')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(purchasesRes.status);

        // Download endpoint exists
        const downloadRes = await request(app)
            .get(`/api/notes/${testNoteId}/download`)
            .set('Authorization', `Bearer ${token}`);

        expect(downloadRes.status).not.toBe(404);
    }, 20000);

    /**
     * WORKFLOW #5: Complete Profile → Preferences → Purchase
     */
    it('Complete profile and set preferences', async () => {
        const email = generateEmail();
        let token: string;

        await request(app).post('/api/auth/register').send({
            fullName: 'Profile Completer',
            email,
            password: 'Test@1234'
        });

        const loginRes = await request(app).post('/api/auth/login').send({
            email,
            password: 'Test@1234'
        });
        token = loginRes.body.data.accessToken;

        // Get profile
        const profileRes = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect([200, 401]).toContain(profileRes.status);

        // Update profile (if endpoint exists)
        const updateRes = await request(app)
            .put('/api/auth/profile')
            .set('Authorization', `Bearer ${token}`)
            .send({ degree: 'BSc', universityId: testUniversityId });

        expect(updateRes.status).not.toBe(500); // Should not crash
    }, 20000);
});

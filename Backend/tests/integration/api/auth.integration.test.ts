import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/config/database';
import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';

/**
 * API Integration Test: Authentication Flow
 * 
 * Purpose: Verify authentication endpoints work correctly with real HTTP requests,
 * database operations, and proper error handling.
 * 
 * Test Strategy:
 * - Real HTTP requests via supertest
 * - Real database operations (test DB)
 * - No mocking of services
 * - Cleanup after each test
 */

describe('API Integration - Authentication Flow', () => {
    // Test user data
    // Test user data - randomized each run to prevent collisions
    const uniqueId = Date.now().toString();
    const testUser = {
        email: `integration.${uniqueId}@example.com`,
        password: 'Test@1234',
        fullName: 'Integration Test User',
        mobile: '+919876543210'
    };

    // Cleanup function
    const cleanupTestUser = async () => {
        try {
            await prisma.users.deleteMany({
                where: {
                    OR: [
                        { email: testUser.email },
                        { email: { contains: 'integration.test' } }
                    ]
                }
            });
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    };

    beforeAll(async () => {
        // Connect to database
        await prisma.$connect();
        // Clean any existing test data
        await cleanupTestUser();
    });

    afterAll(async () => {
        // Final cleanup
        await cleanupTestUser();
        // Disconnect
        await prisma.$disconnect();
    });

    afterEach(async () => {
        // Cleanup after each test
        await cleanupTestUser();
    });

    /**
     * TEST #1: User Registration
     * Endpoint: POST /api/auth/register
     * Expected: 201 Created with user data
     * 
     * Verifications:
     * 1. HTTP response status = 201
     * 2. Response body contains success=true
     * 3. Response contains user object with id
     * 4. User actually stored in database
     * 5. Password is hashed (not plaintext)
     * 6. Email is verified=false initially
     */
    it('should register new user successfully', async () => {
        // Execute HTTP request
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: testUser.email,
                password: testUser.password,
                name: testUser.fullName
            })
            .expect(201).expect('Content-Type', /json/);

        // Verify HTTP response
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data.user).toHaveProperty('id');
        expect(response.body.data.user.email).toBe(testUser.email);
        expect(response.body.data.user.fullName).toBe(testUser.fullName);

        // Verify database state
        const dbUser = await prisma.users.findUnique({
            where: { email: testUser.email }
        });

        expect(dbUser).toBeDefined();
        expect(dbUser!.email).toBe(testUser.email);
        expect(dbUser!.full_name).toBe(testUser.fullName);

        // Verify password is hashed (not plaintext)
        expect(dbUser!.password_hash).not.toBe(testUser.password);
        expect(dbUser!.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern

        // Verify initial state
        expect(dbUser!.is_verified).toBe(false);
        expect(dbUser!.is_active).toBe(true);
        expect(dbUser!.is_seller).toBe(false);
        expect(dbUser!.is_admin).toBe(false);
    });

    /**
     * TEST #2: Registration with duplicate email
     * Expected: 400 Bad Request
     */
    it('should reject duplicate email registration', async () => {
        // First registration
        await request(app)
            .post('/api/auth/register')
            .send({
                email: testUser.email,
                password: testUser.password,
                fullName: testUser.fullName
            })
            .expect(201);

        // Attempt duplicate registration
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: testUser.email,
                password: 'Different@1234',
                name: 'Different Name'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/email.*already.*exists/i);
    });

    /**
     * TEST #3: Registration with invalid email
     * Expected: 400 Bad Request
     */
    it('should reject invalid email format', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'invalid-email',
                password: testUser.password,
                name: testUser.fullName
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    /**
     * TEST #4: Registration with weak password
     * Expected: 400 Bad Request
     */
    it('should reject weak password', async () => {
        const weakPasswords = ['123456', 'password', 'test', 'abc'];

        for (const weakPassword of weakPasswords) {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: `test.${Date.now()}@example.com`,
                    password: weakPassword,
                    name: testUser.fullName
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        }
    });

    /**
     * TEST #5: Registration with missing required fields
     * Expected: 400 Bad Request
     */
    it('should reject registration with missing fields', async () => {
        // Missing email
        let response = await request(app)
            .post('/api/auth/register')
            .send({
                password: testUser.password,
                name: testUser.fullName
            });
        expect(response.status).toBe(400);

        // Missing password
        response = await request(app)
            .post('/api/auth/register')
            .send({
                email: testUser.email,
                name: testUser.fullName
            });
        expect(response.status).toBe(400);

        // Missing fullName
        response = await request(app)
            .post('/api/auth/register')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        expect(response.status).toBe(400);
    });
});

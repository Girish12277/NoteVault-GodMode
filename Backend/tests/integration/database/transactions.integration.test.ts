import { prisma } from '../../../src/config/database';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { randomUUID } from 'crypto';

/**
 * Database Integration Tests - Transactions
 * Tests transaction handling, rollback, and isolation
 */

describe('Database Integration - Transactions', () => {
    const generateReferralCode = () => `REF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.users.deleteMany({
            where: { email: { contains: '.txtest@' } }
        });
        await prisma.$disconnect();
    });

    /**
     * TEST #1: Successful Transaction Commit
     */
    it('should commit transaction successfully', async () => {
        const email = `user1.txtest@example.com`;

        const result = await prisma.$transaction(async (tx) => {
            return await tx.users.create({
                data: {
                    id: randomUUID(),
                    email,
                    password_hash: 'hash',
                    full_name: 'Transaction Test User',
                    referral_code: generateReferralCode(),
                    updated_at: new Date()
                }
            });
        });

        expect(result.email).toBe(email);

        const dbUser = await prisma.users.findUnique({ where: { email } });
        expect(dbUser).not.toBeNull();
    });

    /**
     * TEST #2: Transaction Rollback on Error
     */
    it('should rollback transaction on error', async () => {
        const email1 = `rollback1.txtest@example.com`;

        try {
            await prisma.$transaction(async (tx) => {
                await tx.users.create({
                    data: {
                        id: randomUUID(),
                        email: email1,
                        password_hash: 'hash',
                        full_name: 'User 1',
                        referral_code: generateReferralCode(),
                        updated_at: new Date()
                    }
                });

                // Duplicate email will fail
                await tx.users.create({
                    data: {
                        id: randomUUID(),
                        email: email1,
                        password_hash: 'hash2',
                        full_name: 'User 2',
                        referral_code: generateReferralCode(),
                        updated_at: new Date()
                    }
                });
            });

            expect(true).toBe(false); // Should not reach here
        } catch (error) {
            expect(error).toBeDefined();
        }

        // Verify rollback worked
        const users = await prisma.users.findMany({ where: { email: email1 } });
        expect(users.length).toBe(0);
    });

    /**
     * TEST #3: Concurrent Transactions
     */
    it('should handle concurrent transactions', async () => {
        const email1 = `concurrent1.txtest@example.com`;
        const email2 = `concurrent2.txtest@example.com`;

        const [r1, r2] = await Promise.all([
            prisma.$transaction(async (tx) => {
                return tx.users.create({
                    data: {
                        id: randomUUID(),
                        email: email1,
                        password_hash: 'hash1',
                        full_name: 'Concurrent User 1',
                        referral_code: generateReferralCode(),
                        updated_at: new Date()
                    }
                });
            }),
            prisma.$transaction(async (tx) => {
                return tx.users.create({
                    data: {
                        id: randomUUID(),
                        email: email2,
                        password_hash: 'hash2',
                        full_name: 'Concurrent User 2',
                        referral_code: generateReferralCode(),
                        updated_at: new Date()
                    }
                });
            })
        ]);

        expect(r1.email).toBe(email1);
        expect(r2.email).toBe(email2);
    });

    /**
     * TEST #4: Nested Operations in Transaction
     */
    it('should handle nested operations', async () => {
        const email = `nested.txtest@example.com`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: {
                    id: randomUUID(),
                    email,
                    password_hash: 'hash',
                    full_name: 'Nested User',
                    referral_code: generateReferralCode(),
                    updated_at: new Date()
                }
            });

            const updated = await tx.users.update({
                where: { id: user.id },
                data: { is_verified: true }
            });

            return updated;
        });

        expect(result.is_verified).toBe(true);
    });

    /**
     * TEST #5: Multi-Table Transaction
     */
    it('should handle multi-table operations', async () => {
        const email = `multitable.txtest@example.com`;
        const categoryId = randomUUID();

        await prisma.$transaction(async (tx) => {
            await tx.users.create({
                data: {
                    id: randomUUID(),
                    email,
                    password_hash: 'hash',
                    full_name: 'Multi-Table User',
                    referral_code: generateReferralCode(),
                    is_seller: true,
                    updated_at: new Date()
                }
            });

            await tx.categories.upsert({
                where: { id: categoryId },
                create: {
                    id: categoryId,
                    name: 'Test Category TX',
                    name_hi: 'परीक्षण',
                    slug: `test-category-${Date.now()}`,
                    icon: 'test-icon',
                    updated_at: new Date()
                },
                update: {}
            });
        });

        const user = await prisma.users.findUnique({ where: { email } });
        expect(user).not.toBeNull();

        await prisma.categories.deleteMany({ where: { id: categoryId } });
    });

    /**
     * TEST #6: Transaction with Delay
     */
    it('should handle delayed operations', async () => {
        const email = `delayed.txtest@example.com`;

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.users.create({
                data: {
                    id: randomUUID(),
                    email,
                    password_hash: 'hash',
                    full_name: 'Delayed User',
                    referral_code: generateReferralCode(),
                    updated_at: new Date()
                }
            });

            await new Promise(resolve => setTimeout(resolve, 100));

            return tx.users.update({
                where: { id: user.id },
                data: { is_verified: true }
            });
        });

        expect(result.is_verified).toBe(true);
    });
});

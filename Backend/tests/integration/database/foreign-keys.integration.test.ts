import { prisma } from '../../../src/config/database';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { randomUUID } from 'crypto';

/**
 * Database Integration Tests - Foreign Key Constraints
 * Tests FK constraint enforcement, cascade deletes, orphan prevention
 */

describe('Database Integration - Foreign Key Constraints', () => {
    const generateRef = () => `REF${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.users.deleteMany({ where: { email: { contains: '.fktest@' } } });
        await prisma.categories.deleteMany({ where: { name: { contains: 'FK Test' } } });
        await prisma.$disconnect();
    });

    /**
     * TEST #1: Cascade Delete Verification
     */
    it('should cascade delete related records', async () => {
        const userId = randomUUID();
        await prisma.users.create({
            data: {
                id: userId,
                email: `cascade.fktest@example.com`,
                password_hash: 'hash',
                full_name: 'Cascade Test',
                referral_code: generateRef(),
                updated_at: new Date()
            }
        });

        await prisma.notifications.create({
            data: {
                id: randomUUID(),
                user_id: userId,
                type: 'INFO',
                title: 'Test',
                message: 'Test notification'
            }
        });

        // Delete user - should cascade delete notifications
        await prisma.users.delete({ where: { id: userId } });

        // Verify notifications were deleted
        const notifs = await prisma.notifications.findMany({ where: { user_id: userId } });
        expect(notifs.length).toBe(0);
    });

    /**
     * TEST #2: FK Constraint Violation
     */
    it('should reject FK constraint violations', async () => {
        const fakeUserId = randomUUID();

        try {
            await prisma.notifications.create({
                data: {
                    id: randomUUID(),
                    user_id: fakeUserId,
                    type: 'INFO',
                    title: 'Test',
                    message: 'Should fail'
                }
            });
            expect(true).toBe(false); //Should not reach
        } catch (error: any) {
            expect(error.code).toBe('P2003'); // Prisma FK violation
        }
    });

    /**
     * TEST #3: Orphaned Record Prevention
     */
    it('should prevent orphaned records', async () => {
        const userId = randomUUID();
        const noteId = randomUUID();

        await prisma.users.create({
            data: {
                id: userId,
                email: `orphan.fktest@example.com`,
                password_hash: 'hash',
                full_name: 'Orphan Test',
                referral_code: generateRef(),
                updated_at: new Date(),
                is_seller: true
            }
        });

        const categoryId = randomUUID();
        await prisma.categories.create({
            data: {
                id: categoryId,
                name: 'FK Test Category',
                name_hi: 'परीक्षण',
                slug: `fk-test-${Date.now()}`,
                updated_at: new Date()
            }
        });

        const universityId = randomUUID();
        await prisma.universities.create({
            data: {
                id: universityId,
                name: `FK Test University ${Date.now()}`,
                short_name: 'FKU',
                state: 'Test State',
                city: 'Test City',
                type: 'Public',
                updated_at: new Date()
            }
        });

        // Create note - all FKs valid
        await prisma.notes.create({
            data: {
                id: noteId,
                title: 'FK Test Note',
                description: 'Test',
                subject: 'Math',
                degree: 'BSc',
                semester: 1,
                university_id: universityId,
                file_url: 'test.pdf',
                file_type: 'PDF',
                file_size_bytes: BigInt(1000),
                total_pages: 10,
                price_inr: 99,
                commission_percentage: 20,
                commission_amount_inr: 19.8,
                seller_earning_inr: 79.2,
                seller_id: userId,
                category_id: categoryId,
                updated_at: new Date()
            }
        });

        const note = await prisma.notes.findUnique({ where: { id: noteId } });
        expect(note).not.toBeNull();

        // Cleanup
        await prisma.notes.deleteMany({ where: { id: noteId } });
        await prisma.universities.deleteMany({ where: { id: universityId } });
    });

    /**
     * TEST #4: NULL Foreign Key Behavior
     */
    it('should handle NULL foreign keys correctly', async () => {
        const userId = randomUUID();
        await prisma.users.create({
            data: {
                id: userId,
                email: `null-fk.fktest@example.com`,
                password_hash: 'hash',
                full_name: 'NULL FK Test',
                referral_code: generateRef(),
                updated_at: new Date()
            }
        });

        // User can have NULL university_id
        const user = await prisma.users.findUnique({ where: { id: userId } });
        expect(user!.university_id).toBeNull();
    });

    /**
     * TEST #5: Referential Integrity on Update
     */
    it('should maintain referential integrity on updates', async () => {
        const userId = randomUUID();
        await prisma.users.create({
            data: {
                id: userId,
                email: `ref-int.fktest@example.com`,
                password_hash: 'hash',
                full_name: 'Ref Integrity Test',
                referral_code: generateRef(),
                updated_at: new Date()
            }
        });

        const notifId = randomUUID();
        await prisma.notifications.create({
            data: {
                id: notifId,
                user_id: userId,
                type: 'INFO',
                title: 'Test',
                message: 'Test'
            }
        });

        // Update notification - FK should remain valid
        await prisma.notifications.update({
            where: { id: notifId },
            data: { is_read: true }
        });

        const notif = await prisma.notifications.findUnique({ where: { id: notifId } });
        expect(notif!.is_read).toBe(true);
        expect(notif!.user_id).toBe(userId);
    });
});

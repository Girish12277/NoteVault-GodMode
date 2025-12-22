
import { PrismaClient, CouponType, CouponScope, PayoutStatus, NotificationType, BroadcastStatus, PaymentMethod } from '@prisma/client';
import { CouponService } from '../src/services/couponService';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

describe('GOD-LEVEL Coupon Service Verification', () => {
    let sellerId: string;
    let buyerId: string;
    let categoryId: string;
    let noteId: string;
    let universityId: string;

    beforeAll(async () => {
        // Setup Test Data
        sellerId = uuidv4();
        buyerId = uuidv4();
        categoryId = uuidv4();
        noteId = uuidv4();
        universityId = uuidv4();

        // Create University
        await prisma.universities.create({
            data: {
                id: universityId,
                name: `Test Univ ${uuidv4()}`,
                short_name: 'TU',
                state: 'Test State',
                city: 'Test City',
                type: 'Public',
                courses_offered: ['CS'],
                updated_at: new Date()
            }
        });

        // Create Users
        await prisma.users.createMany({
            data: [
                {
                    id: sellerId,
                    email: `seller_${sellerId}@test.com`,
                    full_name: 'Test Seller',
                    is_seller: true,
                    referral_code: `REF_${sellerId.substring(0, 8)}`,
                    updated_at: new Date()
                },
                {
                    id: buyerId,
                    email: `buyer_${buyerId}@test.com`,
                    full_name: 'Test Buyer',
                    referral_code: `REF_${buyerId.substring(0, 8)}`,
                    updated_at: new Date()
                }
            ]
        });

        // Create Category
        await prisma.categories.create({
            data: {
                id: categoryId,
                name: `Test Cat ${uuidv4()}`,
                name_hi: 'Test Cat Hi',
                slug: `test-cat-${uuidv4()}`,
                updated_at: new Date()
            }
        });

        // Create Note
        await prisma.notes.create({
            data: {
                id: noteId,
                title: 'Test Note',
                description: 'Test Desc',
                subject: 'CS',
                degree: 'BTech',
                university_id: universityId,
                semester: 1,
                file_url: 'http://test.com/file.pdf',
                file_type: 'pdf',
                file_size_bytes: 1024,
                total_pages: 10,
                price_inr: 1000,
                commission_percentage: 10,
                commission_amount_inr: 100,
                seller_earning_inr: 900,
                seller_id: sellerId,
                category_id: categoryId,
                updated_at: new Date()
            }
        });
    });

    afterAll(async () => {
        // Cleanup based on IDs
        await prisma.coupon_usages.deleteMany({ where: { user_id: buyerId } });
        await prisma.coupons.deleteMany({ where: { description: 'TEST_COUPON' } });
        await prisma.notes.delete({ where: { id: noteId } });
        await prisma.categories.delete({ where: { id: categoryId } });
        await prisma.users.deleteMany({ where: { id: { in: [sellerId, buyerId] } } });
        await prisma.universities.delete({ where: { id: universityId } });
        await prisma.$disconnect();
    });

    describe('1. Core Discount Logic', () => {
        test('Should apply FLAT discount correctly', async () => {
            const code = `FLAT_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 100,
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });

            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(true);
            expect(result.discountAmount).toBe(100);
            expect(result.finalAmount).toBe(400);
        });

        test('Should apply PERCENTAGE discount correctly', async () => {
            const code = `PERC_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.PERCENTAGE,
                    value: 20, // 20%
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });

            const result = await CouponService.validateCoupon(buyerId, code, 1000, [noteId]);
            expect(result.isValid).toBe(true);
            expect(result.discountAmount).toBe(200);
            expect(result.finalAmount).toBe(800);
        });

        test('Should expect percentage discount with MAX CAP', async () => {
            const code = `CAP_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.PERCENTAGE,
                    value: 50, // 50% of 1000 = 500
                    max_discount_amount: 100, // Capped at 100
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });

            const result = await CouponService.validateCoupon(buyerId, code, 1000, [noteId]);
            expect(result.isValid).toBe(true);
            expect(result.discountAmount).toBe(100);
            expect(result.finalAmount).toBe(900);
        });

        test('Should not exceed order amount', async () => {
            const code = `OVER_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 2000,
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });

            const result = await CouponService.validateCoupon(buyerId, code, 1000, [noteId]);
            expect(result.isValid).toBe(true);
            expect(result.discountAmount).toBe(1000);
            expect(result.finalAmount).toBe(0);
        });
    });

    describe('2. Validation Constraints (The Guard Rails)', () => {
        test('Should reject EXPIRED coupon', async () => {
            const code = `EXP_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    end_date: new Date(Date.now() - 86400000), // Yesterday
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/expired/i);
        });

        test('Should reject FUTURE (not started) coupon', async () => {
            const code = `FUT_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    start_date: new Date(Date.now() + 86400000), // Tomorrow
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/not yet active/i);
        });

        test('Should reject INACTIVE coupon', async () => {
            const code = `INA_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    is_active: false,
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/inactive/i);
        });

        test('Should reject if MIN ORDER VALUE not met', async () => {
            const code = `MIN_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    min_order_value: 1000,
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/Minimum order value/i);
        });

        test('Should reject if GLOBAL USAGE LIMIT reached', async () => {
            const code = `GLIM_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    usage_limit_global: 1,
                    usage_count: 1, // Already used once
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/limit reached/i);
        });

        test('Should reject if USER USAGE LIMIT reached', async () => {
            const code = `ULIM_${uuidv4().substring(0, 8)}`;
            const coupon = await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    usage_limit_per_user: 1,
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });

            // Simulate one usage
            await prisma.coupon_usages.create({
                data: {
                    coupon_id: coupon.id,
                    user_id: buyerId,
                    discount_amount: 50,
                    // updated_at removed as it does not exist in schema
                }
            });

            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/already used/i);
        });
    });

    describe('3. Scope Logic (Targeting)', () => {
        test('Should apply NOTE scoped coupon to CORRECT note', async () => {
            const code = `NOTE_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 10,
                    scope: CouponScope.NOTE,
                    scope_ids: [noteId],
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(true);
        });

        test('Should REJECT NOTE scoped coupon for WRONG note', async () => {
            const code = `NOTEW_${uuidv4().substring(0, 8)}`;
            const wrongNoteId = uuidv4();
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 10,
                    scope: CouponScope.NOTE,
                    scope_ids: [wrongNoteId],
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(false);
            expect(result.message).toMatch(/not applicable/i);
        });

        test('Should apply CATEGORY scoped coupon to CORRECT category', async () => {
            const code = `CAT_${uuidv4().substring(0, 8)}`;
            await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 10,
                    scope: CouponScope.CATEGORY,
                    scope_ids: [categoryId],
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });
            const result = await CouponService.validateCoupon(buyerId, code, 500, [noteId]);
            expect(result.isValid).toBe(true);
        });
    });

    describe('4. Lifecycle & Usage Tracking', () => {
        test('Should increment usage count after trackUsage', async () => {
            const code = `TRK_${uuidv4().substring(0, 8)}`;
            const coupon = await prisma.coupons.create({
                data: {
                    code,
                    type: CouponType.FLAT,
                    value: 50,
                    description: 'TEST_COUPON',
                    updated_at: new Date()
                }
            });

            await CouponService.trackUsage(coupon.id, buyerId, 50, 'tx_123');

            const updatedCoupon = await prisma.coupons.findUnique({ where: { id: coupon.id } });
            expect(updatedCoupon?.usage_count).toBe(1);

            const usageRecord = await prisma.coupon_usages.findFirst({ where: { coupon_id: coupon.id } });
            expect(usageRecord).toBeTruthy();
            expect(usageRecord?.user_id).toBe(buyerId);
        });
    });
});

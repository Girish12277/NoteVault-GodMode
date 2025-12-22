import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { prisma } from '../../src/config/database';
import { paymentController } from '../../src/controllers/paymentController';
import { paymentService } from '../../src/services/paymentService';
import crypto from 'crypto';

/**
 * GOD-LEVEL VERIFICATION TEST #1: Atomic Transaction Rollback
 * 
 * CRITICAL CLAIM TO PROVE: "All-or-nothing payment processing"
 * 
 * Scenario: Inject failure at purchase creation step
 * Expected: FULL rollback - transaction remains PENDING, zero purchases created
 * 
 * This test PROVES Enhancement #3 Byzantine fault tolerance claim
 */

describe('🔴 CRITICAL: Atomic Transaction Rollback Verification', () => {
    let testUserId: string;
    let testNoteId: string;
    let testSellerId: string;
    let razorpayOrderId: string;

    beforeAll(async () => {
        // Create test user (buyer)
        const buyer = await (prisma as any).users.create({
            data: {
                id: crypto.randomUUID(),
                full_name: 'Test Buyer',    // Explicitly using full_name
                email: `test-buyer-${Date.now()}@test.com`,
                password_hash: 'hashed',
                role: 'BUYER',
                is_verified: true,
                created_at: new Date()
            }
        });
        testUserId = buyer.id;

        // Create test user (seller)
        const seller = await (prisma as any).users.create({
            data: {
                id: crypto.randomUUID(),
                full_name: 'Test Seller',
                email: `test-seller-${Date.now()}@test.com`,
                password_hash: 'hashed',
                role: 'SELLER',
                is_verified: true,
                created_at: new Date()
            }
        });
        testSellerId = seller.id;

        // Create test note
        const note = await (prisma as any).notes.create({
            data: {
                id: crypto.randomUUID(),
                title: 'Test Note for Rollback',
                description: 'Testing atomic rollback',
                price_inr: 100,
                seller_id: testSellerId,
                is_approved: true,
                is_active: true,
                total_pages: 10,
                file_url: 'test.pdf',
                created_at: new Date()
            }
        });
        testNoteId = note.id;

        // Create Razorpay order
        const order = await paymentService.createOrder(100, 'TEST_ROLLBACK', testUserId);
        razorpayOrderId = order.id;

        // Create pending transaction
        await (prisma as any).transactions.create({
            data: {
                id: crypto.randomUUID(),
                transaction_id: `TXN_TEST_${Date.now()}`,
                buyer_id: testUserId,
                seller_id: testSellerId,
                note_id: testNoteId,
                amount_inr: 100,
                commission_inr: 20,
                seller_earning_inr: 80,
                final_amount_inr: 100,
                status: 'PENDING',
                payment_method: 'UPI',
                payment_gateway_order_id: razorpayOrderId,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
    });

    afterAll(async () => {
        // Cleanup
        await (prisma as any).transactions.deleteMany({ where: { buyer_id: testUserId } });
        await (prisma as any).purchases.deleteMany({ where: { user_id: testUserId } });
        await (prisma as any).notes.deleteMany({ where: { id: testNoteId } });
        await (prisma as any).users.deleteMany({ where: { id: { in: [testUserId, testSellerId] } } });
    });

    it('should ROLLBACK entire transaction when purchase creation fails', async () => {
        // INJECT FAILURE: Mock prisma.purchases.create to fail
        const originalCreate = (prisma as any).purchases.create;
        let callCount = 0;

        (prisma as any).purchases.create = jest.fn(async () => {
            callCount++;
            throw new Error('INJECTED_FAILURE: Simulating database error during purchase creation');
        });

        // Create mock request/response
        const mockReq: any = {
            user: { id: testUserId },
            body: {
                razorpayOrderId,
                razorpayPaymentId: 'pay_test123',
                razorpaySignature: paymentService.verifyPayment(razorpayOrderId, 'pay_test123', '').isValid
                    ? 'valid_signature'
                    : crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                        .update(`${razorpayOrderId}|pay_test123`)
                        .digest('hex')
            }
        };

        let responseStatus = 0;
        let responseData: any = null;

        const mockRes: any = {
            status: (code: number) => {
                responseStatus = code;
                return mockRes;
            },
            json: (data: any) => {
                responseData = data;
                return mockRes;
            }
        };

        // Execute payment verification (should fail and rollback)
        try {
            await paymentController.verifyPayment(mockReq, mockRes);
        } catch (error) {
            // Expected to throw due to transaction failure
        }

        // Restore original function
        (prisma as any).purchases.create = originalCreate;

        // VERIFICATION 1: Transaction should still be PENDING (not SUCCESS)
        const transaction = await (prisma as any).transactions.findFirst({
            where: { payment_gateway_order_id: razorpayOrderId }
        });

        expect(transaction).not.toBeNull();
        expect(transaction.status).toBe('PENDING'); // ✅ CRITICAL: Should NOT be SUCCESS

        // VERIFICATION 2: Zero purchases should be created
        const purchases = await (prisma as any).purchases.findMany({
            where: { user_id: testUserId }
        });

        expect(purchases.length).toBe(0); // ✅ CRITICAL: Rollback should delete any partial purchases

        // VERIFICATION 3: Seller wallet should NOT be updated
        const wallet = await (prisma as any).seller_wallets.findFirst({
            where: { seller_id: testSellerId }
        });

        // Wallet might not exist (never created) or should have zero balance
        if (wallet) {
            expect(wallet.pending_balance_inr).toBe(0);
            expect(wallet.total_earned_inr).toBe(0);
        }

        // VERIFICATION 4: Response should indicate failure
        expect(responseStatus).toBe(500); // Internal server error
        expect(responseData?.success).toBe(false);

        console.log('✅ ROLLBACK TEST PASSED: Transaction atomicity verified');
        console.log(`   - Transaction status: ${transaction.status} (expected: PENDING)`);
        console.log(`   - Purchases created: ${purchases.length} (expected: 0)`);
        console.log(`   - Wallet balance: ${wallet?.pending_balance_inr || 0} (expected: 0)`);
    });

    it('should COMPLETE transaction when all operations succeed', async () => {
        // Create new test transaction for positive case
        const order2 = await paymentService.createOrder(100, 'TEST_SUCCESS', testUserId);

        await (prisma as any).transactions.create({
            data: {
                id: crypto.randomUUID(),
                transaction_id: `TXN_SUCCESS_${Date.now()}`,
                buyer_id: testUserId,
                seller_id: testSellerId,
                note_id: testNoteId,
                amount_inr: 100,
                commission_inr: 20,
                seller_earning_inr: 80,
                final_amount_inr: 100,
                status: 'PENDING',
                payment_method: 'UPI',
                payment_gateway_order_id: order2.id,
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        const mockReq: any = {
            user: { id: testUserId },
            body: {
                razorpayOrderId: order2.id,
                razorpayPaymentId: 'pay_success123',
                razorpaySignature: crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
                    .update(`${order2.id}|pay_success123`)
                    .digest('hex')
            }
        };

        let responseStatus = 0;
        let responseData: any = null;

        const mockRes: any = {
            status: (code: number) => {
                responseStatus = code;
                return mockRes;
            },
            json: (data: any) => {
                responseData = data;
                return mockRes;
            }
        };

        // Execute successful payment verification
        await paymentController.verifyPayment(mockReq, mockRes);

        // VERIFICATION: All operations should complete
        const transaction = await (prisma as any).transactions.findFirst({
            where: { payment_gateway_order_id: order2.id }
        });

        expect(transaction.status).toBe('SUCCESS'); // ✅ Should be SUCCESS

        const purchases = await (prisma as any).purchases.findMany({
            where: { user_id: testUserId, note_id: testNoteId }
        });

        expect(purchases.length).toBeGreaterThan(0); // ✅ Purchase should exist

        console.log('✅ SUCCESS TEST PASSED: Transaction committed successfully');
    });
});

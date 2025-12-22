import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export enum RefundStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum RefundReason {
    FILE_CORRUPTION = 'FILE_CORRUPTION',
    NOT_AS_DESCRIBED = 'NOT_AS_DESCRIBED',
    QUALITY_ISSUES = 'QUALITY_ISSUES',
    ACCIDENTAL_PURCHASE = 'ACCIDENTAL_PURCHASE',
    DUPLICATE_PURCHASE = 'DUPLICATE_PURCHASE',
    TECHNICAL_ISSUES = 'TECHNICAL_ISSUES',
    OTHER = 'OTHER',
}

interface RefundRequest {
    userId: string;
    transactionId: string;
    reason: RefundReason;
    reasonDetails?: string;
    ipAddress?: string;
    userAgent?: string;
}

interface RefundApproval {
    refundId: string;
    adminId: string;
    adminNotes?: string;
}

/**
 * God-Level Refund Service
 * Handles complete refund lifecycle with Razorpay integration
 */
export class RefundService {
    /**
     * Validate refund eligibility
     */
    private static async validateRefundEligibility(transactionId: string, userId: string) {
        // Get transaction details
        const transaction = await prisma.$queryRaw<any[]>`
      SELECT 
        t.id,
        t.amount_inr,
        t.razorpay_payment_id,
        t.buyer_id,
        t.seller_id,
        t.note_id,
        t.created_at,
        t.status,
        p.id as purchase_id
      FROM transactions t
      LEFT JOIN purchases p ON p.transaction_id = t.id
      WHERE t.id = ${transactionId}
    `;

        if (!transaction || transaction.length === 0) {
            throw new Error('Transaction not found');
        }

        const txn = transaction[0];

        // Verify ownership
        if (txn.buyer_id !== userId) {
            throw new Error('Unauthorized: You can only refund your own purchases');
        }

        // Check if already refunded
        const existingRefund = await prisma.$queryRaw<any[]>`
      SELECT id, status FROM refunds WHERE transaction_id = ${transactionId}
    `;

        if (existingRefund && existingRefund.length > 0) {
            throw new Error(`Refund already exists with status: ${existingRefund[0].status}`);
        }

        // Check 24-hour window (changed to 30 days for sales psychology guarantee)
        const hoursSincePurchase = (Date.now() - new Date(txn.created_at).getTime()) / (1000 * 60 * 60);
        const maxHours = 24 * 30; // 30 days

        if (hoursSincePurchase > maxHours) {
            throw new Error(`Refund window expired. Refunds must be requested within 30 days of purchase.`);
        }

        // Check if transaction is refundable status
        if (txn.status === 'refunded') {
            throw new Error('Transaction already refunded');
        }

        return {
            transaction: txn,
            hoursSincePurchase,
            isWithin24Hours: hoursSincePurchase <= 24,
        };
    }

    /**
     * Initiate refund request
     */
    static async initiateRefund(request: RefundRequest) {
        try {
            // Validate eligibility
            const validation = await this.validateRefundEligibility(request.transactionId, request.userId);
            const { transaction, isWithin24Hours } = validation;

            // Check abuse tracking
            const abuseCheck = await this.checkRefundAbuse(request.userId);
            if (abuseCheck.isBlocked) {
                throw new Error('Refund blocked: Account flagged for excessive refunds. Contact support.');
            }

            // Calculate refund amount (full amount for now)
            const refundAmount = parseFloat(transaction.amount_inr);
            const gatewayFee = 0; // Razorpay doesn't charge for refunds
            const netRefund = refundAmount - gatewayFee;

            // Create refund record
            const refundId = `REF_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

            const refund = await prisma.$executeRaw`
        INSERT INTO refunds (
          id,
          transaction_id,
          purchase_id,
          user_id,
          note_id,
          seller_id,
          amount_inr,
          gateway_fee_inr,
          net_refund_inr,
          reason,
          reason_details,
          razorpay_payment_id,
          ip_address,
          user_agent,
          metadata
        ) VALUES (
          ${refundId},
          ${transaction.id},
          ${transaction.purchase_id},
          ${request.userId},
          ${transaction.note_id},
          ${transaction.seller_id},
          ${refundAmount},
          ${gatewayFee},
          ${netRefund},
          ${request.reason}::RefundReason,
          ${request.reasonDetails || null},
          ${transaction.razorpay_payment_id},
          ${request.ipAddress || null},
          ${request.userAgent || null},
          ${JSON.stringify({ isWithin24Hours })}
        )
        RETURNING *
      `;

            // Get created refund
            const createdRefund = await prisma.$queryRaw<any[]>`
        SELECT * FROM refunds WHERE id = ${refundId}
      `;

            return {
                success: true,
                refundId,
                status: createdRefund[0].status,
                message: createdRefund[0].is_auto_approved
                    ? 'Refund auto-approved and processing'
                    : 'Refund request submitted for review',
                isAutoApproved: createdRefund[0].is_auto_approved,
                estimatedProcessingTime: createdRefund[0].is_auto_approved ? '1-2 hours' : '24-48 hours',
            };
        } catch (error: any) {
            console.error('Refund initiation error:', error);
            throw error;
        }
    }

    /**
     * Process approved refund with Razorpay
     */
    static async processRefund(refundId: string) {
        try {
            // Get refund details
            const refundData = await prisma.$queryRaw<any[]>`
        SELECT * FROM refunds WHERE id = ${refundId} AND status = 'APPROVED'
      `;

            if (!refundData || refundData.length === 0) {
                throw new Error('Refund not found or not approved');
            }

            const refund = refundData[0];

            // Update status to PROCESSING
            await prisma.$executeRaw`
        UPDATE refunds 
        SET status = 'PROCESSING'::RefundStatus, updated_at = NOW()
        WHERE id = ${refundId}
      `;

            // Process refund with Razorpay
            const razorpayRefund = await razorpay.payments.refund(refund.razorpay_payment_id, {
                amount: Math.round(parseFloat(refund.net_refund_inr) * 100), // Convert to paisa
                speed: 'normal', // 'normal' or 'optimum'
                notes: {
                    refund_id: refundId,
                    reason: refund.reason,
                },
            });

            // Update refund with gateway details
            await prisma.$executeRaw`
        UPDATE refunds 
        SET 
          razorpay_refund_id = ${razorpayRefund.id},
          gateway_status = ${razorpayRefund.status},
          status = 'COMPLETED'::RefundStatus,
          processed_at = NOW(),
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${refundId}
      `;

            // Update transaction status
            await prisma.$executeRaw`
        UPDATE transactions
        SET 
          status = 'refunded',
          refund_id = ${refundId},
          is_refunded = TRUE,
          refunded_at = NOW()
        WHERE id = ${refund.transaction_id}
      `;

            // Revoke purchase access
            await prisma.$executeRaw`
        UPDATE purchases
        SET is_active = FALSE
        WHERE transaction_id = ${refund.transaction_id}
      `;

            // Deduct from seller wallet (if already transferred)
            await this.adjustSellerBalance(refund.seller_id, refund.amount_inr, refund.transaction_id);

            return {
                success: true,
                refundId,
                razorpayRefundId: razorpayRefund.id,
                status: 'COMPLETED',
                amount: refund.net_refund_inr,
            };
        } catch (error: any) {
            console.error('Refund processing error:', error);

            // Mark as failed
            await prisma.$executeRaw`
        UPDATE refunds 
        SET 
          status = 'FAILED'::RefundStatus,
          gateway_error = ${error.message},
          failed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${refundId}
      `;

            throw error;
        }
    }

    /**
     * Admin approve/reject refund
     */
    static async approveRefund(approval: RefundApproval) {
        await prisma.$executeRaw`
      UPDATE refunds
      SET 
        status = 'APPROVED'::RefundStatus,
        approved_by_admin_id = ${approval.adminId},
        approved_at = NOW(),
        admin_notes = ${approval.adminNotes || null},
        updated_at = NOW()
      WHERE id = ${approval.refundId}
    `;

        // Immediately process approved refund
        return await this.processRefund(approval.refundId);
    }

    static async rejectRefund(refundId: string, adminId: string, adminNotes?: string) {
        await prisma.$executeRaw`
      UPDATE refunds
      SET 
        status = 'REJECTED'::RefundStatus,
        rejected_by_admin_id = ${adminId},
        admin_notes = ${adminNotes || null},
        updated_at = NOW()
      WHERE id = ${refundId}
    `;

        return { success: true, status: 'REJECTED' };
    }

    /**
     * Check refund abuse
     */
    private static async checkRefundAbuse(userId: string) {
        const abuse = await prisma.$queryRaw<any[]>`
      SELECT * FROM refund_abuse_tracking WHERE user_id = ${userId}
    `;

        if (!abuse || abuse.length === 0) {
            return { isBlocked: false, isFlagged: false };
        }

        return {
            isBlocked: abuse[0].is_blocked_from_refunds,
            isFlagged: abuse[0].is_flagged,
            totalRefunds: abuse[0].total_refunds,
            refundsLast30Days: abuse[0].refunds_last_30_days,
        };
    }

    /**
     * Adjust seller balance after refund
     */
    private static async adjustSellerBalance(sellerId: string, amount: number, transactionId: string) {
        // Check if seller already received payment
        const sellerWallet = await prisma.$queryRaw<any[]>`
      SELECT * FROM seller_wallets WHERE seller_id = ${sellerId}
    `;

        if (sellerWallet && sellerWallet.length > 0) {
            const currentBalance = parseFloat(sellerWallet[0].available_balance_inr);

            if (currentBalance >= amount) {
                // Deduct from available balance
                await prisma.$executeRaw`
          UPDATE seller_wallets
          SET available_balance_inr = available_balance_inr - ${amount}
          WHERE seller_id = ${sellerId}
        `;
            } else {
                // Mark as debt for future earnings
                await prisma.$executeRaw`
          UPDATE seller_wallets
          SET pending_balance_inr = pending_balance_inr - ${amount}
          WHERE seller_id = ${sellerId}
        `;
            }
        }
    }

    /**
     * Get refund by ID
     */
    static async getRefund(refundId: string) {
        const refund = await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        n.title as note_title,
        t.amount_inr as transaction_amount
      FROM refunds r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN notes n ON n.id = r.note_id
      LEFT JOIN transactions t ON t.id = r.transaction_id
      WHERE r.id = ${refundId}
    `;

        return refund[0] || null;
    }

    /**
     * Get user refunds
     */
    static async getUserRefunds(userId: string) {
        return await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        n.title as note_title,
        n.cover_image as note_cover
      FROM refunds r
      LEFT JOIN notes n ON n.id = r.note_id
      WHERE r.user_id = ${userId}
      ORDER BY r.created_at DESC
    `;
    }

    /**
     * Get pending refunds (for admin)
     */
    static async getPendingRefunds() {
        return await prisma.$queryRaw<any[]>`
      SELECT 
        r.*,
        u.full_name as user_name,
        u.email as user_email,
        n.title as note_title,
        abuse.total_refunds as user_total_refunds,
        abuse.is_flagged as user_is_flagged
      FROM refunds r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN notes n ON n.id = r.note_id
      LEFT JOIN refund_abuse_tracking abuse ON abuse.user_id = r.user_id
      WHERE r.status = 'PENDING'
      ORDER BY r.created_at ASC
    `;
    }
}

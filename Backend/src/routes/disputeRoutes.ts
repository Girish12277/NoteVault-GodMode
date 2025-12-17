import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';

const router = Router();

// Helper for strict audit logging
const createAuditLog = async (
    tx: any,
    actorId: string,
    action: string,
    targetId: string,
    payload: any,
    result: 'SUCCESS' | 'FAILURE' | 'BLOCKED',
    gatewayRef?: string,
    idempotencyKey?: string
) => {
    // Audit model is camelCase
    await (tx as any).audit.create({
        data: {
            actorId,
            action,
            targetType: 'DISPUTE',
            targetId,
            payload: JSON.stringify(payload),
            result,
            gatewayRef,
            idempotencyKey
        }
    });
};

// CREATE Dispute
router.post('/', authenticate, async (req: AuthRequest, res) => {
    const { transactionId, reason } = req.body;
    const userId = req.user!.id;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!transactionId || !reason) {
        return res.status(400).json({ success: false, message: 'Transaction ID and reason are required' });
    }

    try {
        const prismaAny = prisma as any;

        // Verify transaction ownership and eligibility
        const transaction = await prismaAny.transactions.findUnique({
            where: { id: transactionId },
            include: { disputes: true }
        });

        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

        // Use correct relation check for buyer
        if (transaction.buyer_id !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (transaction.status !== 'SUCCESS') {
            return res.status(400).json({ success: false, message: 'Cannot dispute incomplete transaction' });
        }

        if (transaction.disputes && transaction.disputes.length > 0) {
            const openDispute = transaction.disputes.find((d: any) => d.status !== 'RESOLVED' && d.status !== 'REJECTED');
            if (openDispute) return res.status(400).json({ success: false, message: 'Active dispute already exists' });
        }

        // Create dispute
        const dispute = await prismaAny.dispute.create({
            data: {
                transaction_id: transactionId,
                reporter_id: userId,
                reason,
                status: 'OPEN'
            }
        });


        // Audit log (optional but good for consistency)
        if (idempotencyKey) {
            await createAuditLog(prisma, userId, 'DISPUTE_CREATED', dispute.id, { reason }, 'SUCCESS', undefined, idempotencyKey);
        }

        // Send Notification to User
        await prismaAny.notifications.create({
            data: {
                id: require('crypto').randomUUID(),
                user_id: userId,
                type: 'INFO', // or 'DISPUTE' if enum allows
                title: 'Dispute Submitted',
                message: `We received your dispute for transaction ${transactionId}. Our support team will review your request shortly.`,
                created_at: new Date()
            }
        });

        return res.status(201).json({ success: true, message: 'Dispute submitted successfully', data: dispute });

    } catch (error) {
        console.error('Create dispute error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit dispute' });
    }
});

// GET /api/admin/disputes
router.get('/', authenticate, requireAdmin, async (req, res) => {
    try {
        // USE CAST TO AVOID TS ERROR ON DISPUTE MODEL
        // USE CAST TO AVOID TS ERROR ON DISPUTE MODEL
        const disputes = await (prisma as any).dispute.findMany({
            include: {
                transaction: {
                    select: {
                        amount_inr: true,
                        payment_gateway_payment_id: true,
                        // Include relations via transaction
                        users_transactions_buyer_idTousers: { select: { full_name: true, email: true } },
                        users_transactions_seller_idTousers: { select: { full_name: true } },
                        notes: { select: { title: true } }
                    }
                },
                reporter: { select: { id: true, full_name: true, email: true } }, // Fixed field name
            },
            orderBy: { created_at: 'desc' }
        });

        // Flatten for frontend
        const formattedDisputes = disputes.map((d: any) => ({
            ...d,
            orderId: d.transaction_id,
            amount: d.transaction?.amount_inr || 0,
            reporterName: d.reporter?.full_name,
            reporterEmail: d.reporter?.email,
            // Map nested transaction data to top-level expected by UI
            buyer: {
                name: d.transaction?.users_transactions_buyer_idTousers?.full_name || 'Unknown',
                email: d.transaction?.users_transactions_buyer_idTousers?.email
            },
            seller: {
                name: d.transaction?.users_transactions_seller_idTousers?.full_name || 'Unknown'
            },
            note: {
                title: d.transaction?.notes?.title || 'Unknown Note'
            }
        }));

        res.json({ success: true, data: { disputes: formattedDisputes } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch disputes' });
    }
});

// Resolve Dispute (Atomic + Optimistic Lock)
router.put('/:id/resolve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { resolution, refund, currentVersion } = req.body;
    const adminId = req.user!.id;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
        return res.status(400).json({ success: false, message: 'Idempotency-Key header is required' });
    }

    try {
        const prismaAny = prisma as any;
        const existingAudit = await prismaAny.audit.findFirst({
            where: { idempotencyKey, action: 'DISPUTE_RESOLVED' }
        });
        if (existingAudit) {
            return res.json({ success: true, message: 'Dispute already resolved (Cached)', auditId: existingAudit.id });
        }

        const dispute = await prismaAny.dispute.findUnique({
            where: { id },
            include: { transaction: true }
        });
        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        let gatewayRef: string | undefined;
        if (refund && dispute.transaction) {
            const refundResult = await PaymentService.processRefund(
                dispute.transaction.id,
                Number(dispute.transaction.amount_inr),
                idempotencyKey
            );

            if (!refundResult.success) {
                await createAuditLog(prisma, adminId, 'DISPUTE_REFUND_FAILED', id, { error: refundResult.error }, 'FAILURE', undefined, idempotencyKey);
                return res.status(502).json({ success: false, message: 'Payment gateway rejected refund', error: refundResult.error });
            }
            gatewayRef = refundResult.gatewayRef;
        }

        await prisma.$transaction(async (tx) => {
            const txAny = tx as any;

            const updateResult = await txAny.dispute.updateMany({
                where: {
                    id,
                    version: currentVersion
                },
                data: {
                    status: 'RESOLVED',
                    resolution,
                    version: { increment: 1 }
                }
            });

            if (updateResult.count === 0) {
                throw new Error('CONFLICT');
            }

            if (refund && dispute.transaction) {
                await txAny.transactions.update({
                    where: { id: dispute.transaction_id },
                    data: { status: 'REFUNDED' }
                });

                await txAny.refundRecord.create({
                    data: {
                        transactionId: dispute.transaction_id,
                        amount: dispute.transaction.amount_inr,
                        currency: 'INR',
                        gatewayRef: gatewayRef || 'mock_ref',
                        status: 'COMPLETED',
                        idempotencyKey,
                        reason: resolution
                    }
                });

                await txAny.ledgerEntry.create({
                    data: {
                        transactionId: dispute.transaction_id,
                        type: 'REFUND',
                        amount: dispute.transaction.amount_inr,
                        balanceBefore: 0,
                        balanceAfter: 0,
                        description: `Refund for dispute ${id}`
                    }
                });
            }

            await createAuditLog(
                tx,
                adminId,
                'DISPUTE_RESOLVED',
                id,
                { resolution, refund },
                'SUCCESS',
                gatewayRef,
                idempotencyKey
            );

            // Notify User
            await txAny.notifications.create({
                data: {
                    id: require('crypto').randomUUID(),
                    user_id: dispute.reporter_id,
                    type: 'SUCCESS',
                    title: 'Dispute Resolved',
                    message: `Your dispute for ${dispute.transaction?.notes?.title || 'note'} has been resolved: ${resolution}`,
                    created_at: new Date()
                }
            });
        });

        return res.json({ success: true, message: 'Dispute resolved successfully', gatewayRef });

    } catch (error: any) {
        if (error.message === 'CONFLICT') {
            return res.status(409).json({ success: false, message: 'Dispute was updated by someone else' });
        }
        console.error('Resolve error:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Reject Dispute
router.put('/:id/reject', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { reason, currentVersion } = req.body;
    const adminId = req.user!.id;
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) return res.status(400).json({ message: 'Idempotency-Key required' });

    try {
        const prismaAny = prisma as any;
        const existing = await prismaAny.audit.findFirst({ where: { idempotencyKey, action: 'DISPUTE_REJECTED' } });
        if (existing) return res.json({ success: true, message: 'Already rejected (Cached)' });

        await prisma.$transaction(async (tx) => {
            const txAny = tx as any;
            const update = await txAny.dispute.updateMany({
                where: { id, version: currentVersion },
                data: {
                    status: 'REJECTED',
                    resolution: reason,
                    version: { increment: 1 }
                }
            });

            if (update.count === 0) throw new Error('CONFLICT');

            await createAuditLog(tx, adminId, 'DISPUTE_REJECTED', id, { reason }, 'SUCCESS', undefined, idempotencyKey);

            // Notify User
            await txAny.notifications.create({
                data: {
                    id: require('crypto').randomUUID(),
                    user_id: (await txAny.dispute.findUnique({ where: { id } })).reporter_id, // Fetch reporter_id inside tx
                    type: 'ERROR',
                    title: 'Dispute Update',
                    message: `Your dispute was closed. Reason: ${reason}`,
                    created_at: new Date()
                }
            });
        });

        return res.json({ success: true, message: 'Dispute rejected' });
    } catch (error: any) {
        if (error.message === 'CONFLICT') return res.status(409).json({ success: false, message: 'Conflict or invalid state' });
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Dispute not found' });

        console.error('Reject error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject dispute' });
    }
});

export default router;

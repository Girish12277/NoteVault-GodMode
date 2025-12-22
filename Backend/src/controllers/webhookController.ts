import { Request, Response } from 'express';
import { prisma } from '../config/database';
import crypto from 'crypto';
import { alertService } from '../services/alertService';

const prismaAny = prisma as any;

/**
 * Webhook Controller (Enhancement #5)
 * God-Tier: Server-initiated payment verification (not client-initiated)
 * 
 * Security Features:
 * 1. Signature verification (Razorpay webhook secret)
 * 2. Idempotency (prevent duplicate processing)
 * 3. Timestamp validation (prevent replay attacks)
 */

interface RazorpayWebhookEvent {
    event: string;
    payload: {
        payment: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                status: string;
                created_at: number;
            }
        }
    };
    created_at: number;
}

export const webhookController = {
    /**
     * POST /api/webhooks/razorpay
     * Handle Razorpay webhook notifications
     */
    handleRazorpay: async (req: Request, res: Response) => {
        try {
            // 1. SIGNATURE VERIFICATION (Security Critical)
            const webhookSignature = req.headers['x-razorpay-signature'] as string;
            const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

            if (!webhookSecret) {
                console.error('[WEBHOOK] FATAL: RAZORPAY_WEBHOOK_SECRET not configured');
                return res.status(500).json({ error: 'Webhook not configured' });
            }

            if (!webhookSignature) {
                console.warn('[WEBHOOK] SECURITY: Missing signature header');
                alertService.warning('WEBHOOK_MISSING_SIGNATURE',
                    'Webhook received without signature header',
                    { ip: req.ip }
                );
                return res.status(400).json({ error: 'Missing signature' });
            }

            // Generate expected signature
            const webhookBody = JSON.stringify(req.body);
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(webhookBody)
                .digest('hex');

            // Timing-safe comparison
            const isValid = crypto.timingSafeEqual(
                Buffer.from(expectedSignature, 'utf8'),
                Buffer.from(webhookSignature, 'utf8')
            );

            if (!isValid) {
                console.warn('[WEBHOOK] SECURITY: Invalid signature');
                alertService.critical('WEBHOOK_INVALID_SIGNATURE',
                    'Razorpay webhook signature verification failed',
                    { ip: req.ip, event: req.body.event }
                );
                return res.status(401).json({ error: 'Invalid signature' });
            }

            const event: RazorpayWebhookEvent = req.body;

            // 2. TIMESTAMP VALIDATION (Replay Attack Prevention)
            const eventAge = Date.now() - (event.created_at * 1000); // Convert to ms
            const MAX_EVENT_AGE = 5 * 60 * 1000; // 5 minutes

            if (eventAge > MAX_EVENT_AGE) {
                console.warn(`[WEBHOOK] SECURITY: Webhook too old (${Math.round(eventAge / 1000)}s)`);
                alertService.warning('WEBHOOK_EVENT_EXPIRED',
                    `Webhook rejected: event age ${Math.round(eventAge / 1000)}s`,
                    { eventId: event.payload.payment.entity.id, ageSeconds: Math.round(eventAge / 1000) }
                );
                return res.status(400).json({ error: 'Event too old' });
            }

            // 3. EVENT TYPE FILTERING (Only process payment.authorized)
            if (event.event !== 'payment.authorized') {
                console.log(`[WEBHOOK] Ignoring event type: ${event.event}`);
                return res.status(200).json({ received: true, processed: false });
            }

            const payment = event.payload.payment.entity;
            const razorpayOrderId = payment.order_id;
            const razorpayPaymentId = payment.id;

            // 4. IDEMPOTENCY CHECK (Prevent Duplicate Processing)
            const eventId = `webhook_${razorpayPaymentId}`;

            const existingWebhookLog = await prismaAny.webhook_logs.findFirst({
                where: { event_id: eventId }
            });

            if (existingWebhookLog) {
                console.log(`[WEBHOOK] IDEMPOTENCY: Event ${eventId} already processed`);
                return res.status(200).json({ received: true, already_processed: true });
            }

            // 5. FIND TRANSACTIONS
            const transactions = await prismaAny.transactions.findMany({
                where: { payment_gateway_order_id: razorpayOrderId },
                include: {
                    notes: {
                        select: {
                            id: true,
                            title: true,
                            file_url: true,
                            seller_id: true
                        }
                    }
                }
            });

            if (transactions.length === 0) {
                console.warn(`[WEBHOOK] Order not found: ${razorpayOrderId}`);
                await logWebhookEvent(eventId, event.event, webhookBody, 'ORDER_NOT_FOUND');
                return res.status(404).json({ error: 'Order not found' });
            }

            // 6. VERIFY STATUS (Should be PENDING)
            if (transactions[0].status !== 'PENDING') {
                console.warn(`[WEBHOOK] Transaction already processed: ${transactions[0].status}`);
                await logWebhookEvent(eventId, event.event, webhookBody, 'ALREADY_PROCESSED');
                return res.status(200).json({ received: true, already_processed: true });
            }

            const userId = transactions[0].buyer_id;

            // 7. ATOMIC PAYMENT PROCESSING (Same as verifyPayment)
            await prisma.$transaction(async (tx) => {
                // Update transactions to SUCCESS
                console.log('[WEBHOOK-TX] Updating transactions to SUCCESS');
                await tx.transactions.updateMany({
                    where: { payment_gateway_order_id: razorpayOrderId },
                    data: {
                        status: 'SUCCESS',
                        payment_gateway_payment_id: razorpayPaymentId,
                        escrow_release_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                        updated_at: new Date()
                    }
                });

                // Process each note
                for (const txn of transactions) {
                    const watermarkId = `WM_${userId.substring(0, 8)}_${Date.now()}_${txn.note_id.substring(0, 4)}`;
                    const note = txn.notes;

                    // Create Purchase
                    await tx.purchases.create({
                        data: {
                            id: crypto.randomUUID(),
                            user_id: userId,
                            note_id: txn.note_id,
                            transaction_id: txn.id,
                            watermarked_file_url: note.file_url,
                            watermark_id: watermarkId,
                            download_count: 0,
                            is_active: true,
                            created_at: new Date()
                        }
                    });

                    // Update Note Purchase Count
                    await tx.notes.update({
                        where: { id: txn.note_id },
                        data: {
                            purchase_count: { increment: 1 },
                            updated_at: new Date()
                        }
                    });

                    // Update Seller Wallet
                    await tx.seller_wallets.upsert({
                        where: { seller_id: txn.seller_id },
                        create: {
                            id: crypto.randomUUID(),
                            seller_id: txn.seller_id,
                            available_balance_inr: 0,
                            pending_balance_inr: Number(txn.seller_earning_inr),
                            total_earned_inr: Number(txn.seller_earning_inr),
                            total_withdrawn_inr: 0,
                            minimum_withdrawal_amount: 100,
                            is_active: true,
                            created_at: new Date(),
                            updated_at: new Date()
                        },
                        update: {
                            pending_balance_inr: { increment: Number(txn.seller_earning_inr) },
                            total_earned_inr: { increment: Number(txn.seller_earning_inr) },
                            updated_at: new Date()
                        }
                    });

                    // Seller Notification
                    await tx.notifications.create({
                        data: {
                            id: crypto.randomUUID(),
                            user_id: txn.seller_id,
                            type: 'SALE',
                            title: 'New Sale!',
                            message: `You sold "${note.title}"`,
                            created_at: new Date()
                        }
                    });
                }

                // Buyer Notification
                await tx.notifications.create({
                    data: {
                        id: crypto.randomUUID(),
                        user_id: userId,
                        type: 'PURCHASE',
                        title: 'Purchase Successful',
                        message: `You successfully purchased ${transactions.length} notes.`,
                        created_at: new Date()
                    }
                });

                // Log webhook event
                await tx.webhook_logs.create({
                    data: {
                        id: crypto.randomUUID(),
                        event_id: eventId,
                        event_type: event.event,
                        payload: webhookBody,
                        status: 'PROCESSED',
                        processed_at: new Date(),
                        created_at: new Date()
                    }
                });
            }, {
                maxWait: 5000,
                timeout: 10000,
                isolationLevel: 'Serializable'
            });

            console.log('[WEBHOOK] Payment processed successfully via server-side webhook');

            // Alert on successful webhook processing
            alertService.warning('WEBHOOK_PAYMENT_SUCCESS',
                `Payment processed via webhook: ${razorpayPaymentId}`,
                { orderId: razorpayOrderId, noteCount: transactions.length }
            );

            return res.status(200).json({ received: true, processed: true });

        } catch (error: unknown) {
            console.error('[WEBHOOK] Processing error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            alertService.critical('WEBHOOK_PROCESSING_ERROR',
                `Webhook processing failed: ${errorMessage}`,
                { error: errorMessage }
            );

            return res.status(500).json({ error: 'Processing failed' });
        }
    }
};

// Helper function to log webhook events
async function logWebhookEvent(eventId: string, eventType: string, payload: string, status: string) {
    try {
        await prismaAny.webhook_logs.create({
            data: {
                id: crypto.randomUUID(),
                event_id: eventId,
                event_type: eventType,
                payload,
                status,
                processed_at: new Date(),
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error('[WEBHOOK] Failed to log event:', error);
    }
}

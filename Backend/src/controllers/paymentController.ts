import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { paymentService } from '../services/paymentService';
import { invoiceService } from '../services/invoiceService';
import crypto from 'crypto';

const prismaAny = prisma as any;

export const paymentController = {
    /**
     * POST /api/payments/create-order
     * Create a Razorpay order for purchasing multiple notes (Cart Checkout)
     */
    createOrder: async (req: AuthRequest, res: Response) => {
        try {
            // Check if payment service is enabled
            if (!paymentService.isEnabled()) {
                return res.status(503).json({
                    success: false,
                    message: 'Payment service is not configured',
                    code: 'PAYMENT_SERVICE_UNAVAILABLE'
                });
            }

            const { noteIds, couponCode: _couponCode } = req.body;
            const userId = req.user!.id;

            if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No notes selected for purchase',
                    code: 'NO_NOTES_SELECTED'
                });
            }

            // Fetch all notes details
            const notes = await prismaAny.notes.findMany({
                where: {
                    id: { in: noteIds },
                    is_approved: true,
                    is_active: true,
                    is_deleted: false
                },
                select: {
                    id: true,
                    title: true,
                    price_inr: true,
                    seller_id: true,
                    total_pages: true
                }
            });

            if (notes.length !== noteIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Some notes are no longer available',
                    code: 'NOTES_UNAVAILABLE'
                });
            }

            // Prevent buying own notes & Check prior purchases
            const existingPurchases = await prismaAny.purchases.findMany({
                where: {
                    user_id: userId,
                    note_id: { in: noteIds }
                },
                select: { note_id: true }
            });

            const alreadyPurchasedIds = existingPurchases.map((p: any) => p.note_id);
            const ownNoteTypes = notes.filter((n: any) => n.seller_id === userId);

            if (ownNoteTypes.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot purchase your own notes',
                    code: 'OWN_NOTE'
                });
            }

            if (alreadyPurchasedIds.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Some notes are already purchased',
                    code: 'ALREADY_PURCHASED',
                    data: { purchasedNoteIds: alreadyPurchasedIds }
                });
            }

            // Calculate total price for the BULK ORDER
            const totalAmount = notes.reduce((sum: number, note: any) => sum + Number(note.price_inr), 0);

            // Create ONE Razorpay Order for the total amount
            const order = await paymentService.createOrder(totalAmount, `BULK_${notes.length}_ITEMS`, userId);

            // Create Transaction record for EACH note
            const transactions = await Promise.all(notes.map(async (note: any) => {
                const commission = paymentService.calculateCommission(Number(note.price_inr), note.total_pages);

                return prismaAny.transactions.create({
                    data: {
                        id: crypto.randomUUID(),
                        transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                        buyer_id: userId,
                        seller_id: note.seller_id,
                        note_id: note.id,
                        amount_inr: note.price_inr,
                        commission_inr: commission.commissionAmountInr,
                        seller_earning_inr: commission.sellerEarningInr,
                        final_amount_inr: note.price_inr, // Individual price
                        status: 'PENDING',
                        payment_method: 'UPI',
                        payment_gateway_order_id: order.id,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });
            }));

            return res.json({
                success: true,
                data: {
                    orderId: order.id,
                    transactionIds: transactions.map((t: any) => t.id),
                    amount: order.amount,
                    currency: order.currency,
                    key: paymentService.getPublicKey(),
                    notes: notes.map((n: any) => ({
                        id: n.id,
                        title: n.title,
                        price: Number(n.price_inr)
                    }))
                }
            });
        } catch (error: unknown) {
            console.error('Create order error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Failed to create payment order',
                code: 'ORDER_CREATION_FAILED',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            });
        }
    },

    /**
     * POST /api/payments/verify
     * Verify payment after successful Razorpay payment
     */
    verifyPayment: async (req: AuthRequest, res: Response) => {
        try {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
            const userId = req.user!.id;

            // Find ALL transactions linked to this Order ID
            const transactions = await prismaAny.transactions.findMany({
                where: { payment_gateway_order_id: razorpayOrderId },
                include: {
                    notes: { // Relation accessor 'notes' (plural) confirmed by error log
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
                return res.status(404).json({
                    success: false,
                    message: 'Transactions not found for this order',
                    code: 'TRANSACTION_NOT_FOUND'
                });
            }

            // Verify User
            if (transactions[0].buyer_id !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized',
                    code: 'UNAUTHORIZED'
                });
            }

            // Verify just one (they should all be same status)
            if (transactions[0].status !== 'PENDING' && transactions[0].status !== 'FAILED') {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction already processed',
                    code: 'ALREADY_PROCESSED'
                });
            }

            // Verify payment signature
            const verification = paymentService.verifyPayment(
                razorpayOrderId,
                razorpayPaymentId,
                razorpaySignature
            );

            if (!verification.isValid) {
                // Update ALL transactions as failed
                await prismaAny.transactions.updateMany({
                    where: { payment_gateway_order_id: razorpayOrderId },
                    data: {
                        status: 'FAILED',
                        updated_at: new Date()
                    }
                });

                return res.status(400).json({
                    success: false,
                    message: 'Payment verification failed',
                    code: 'VERIFICATION_FAILED',
                    error: verification.error
                });
            }

            // --- SUCCESS FLOW ---

            // 1. Update ALL transactions to SUCCESS
            console.log('LOG: Updating transactions to SUCCESS');
            await prismaAny.transactions.updateMany({
                where: { payment_gateway_order_id: razorpayOrderId },
                data: {
                    status: 'SUCCESS',
                    payment_gateway_payment_id: razorpayPaymentId,
                    payment_gateway_signature: razorpaySignature,
                    escrow_release_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    updated_at: new Date()
                }
            });

            // 2. Process each note
            const purchasePromises = transactions.map(async (txn: any) => {
                const watermarkId = `WM_${userId.substring(0, 8)}_${Date.now()}_${txn.note_id.substring(0, 4)}`;
                const note = txn.notes; // access relation 'notes'

                // Create Purchase
                console.log('LOG: Creating Purchase for', txn.id);
                await prismaAny.purchases.create({
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
                console.log('LOG: Updating Note Count', txn.note_id);
                await prismaAny.notes.update({
                    where: { id: txn.note_id },
                    data: {
                        purchase_count: { increment: 1 },
                        updated_at: new Date()
                    }
                });

                // Update Seller Wallet
                console.log('LOG: Updating Seller Wallet', txn.seller_id);
                await prismaAny.seller_wallets.upsert({
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

                // Notifications
                console.log('LOG: Creating Notification');
                await prismaAny.notifications.create({
                    data: {
                        id: crypto.randomUUID(),
                        user_id: txn.seller_id,
                        type: 'SALE',
                        title: 'New Sale!',
                        message: `You sold "${note.title}"`,
                        created_at: new Date()
                    }
                });
            });

            await Promise.all(purchasePromises);

            // Buyer Notification
            await prismaAny.notifications.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    type: 'PURCHASE',
                    title: 'Purchase Successful',
                    message: `You successfully purchased ${transactions.length} notes.`,
                    created_at: new Date()
                }
            });

            return res.json({
                success: true,
                message: 'Payment verified successfully!',
                data: {
                    orderId: razorpayOrderId,
                    purchasedNoteIds: transactions.map((t: any) => t.note_id)
                }
            });
        } catch (error: unknown) {
            console.error('Verify payment error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Payment verification failed',
                code: 'VERIFICATION_ERROR',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            });
        }
    },

    /**
     * GET /api/payments/transactions
     * Get user's transaction history
     */
    getTransactions: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const { page = '1', limit = '20' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const [transactions, total] = await Promise.all([
                prismaAny.transactions.findMany({
                    where: { buyer_id: userId },
                    orderBy: { created_at: 'desc' },
                    skip,
                    take: Number(limit),
                    include: {
                        notes: {
                            select: { id: true, title: true }
                        }
                    }
                }),
                prismaAny.transactions.count({ where: { buyer_id: userId } })
            ]);

            return res.json({
                success: true,
                data: {
                    transactions: transactions.map((t: any) => ({
                        ...t,
                        note: t.notes
                    })),
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: unknown) {
            console.error('Get transactions error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch transactions',
                code: 'FETCH_ERROR'
            });
        }
    },
    /**
     * GET /api/payments/invoice/:paymentId
     * Generate and download PDF invoice
     */
    downloadInvoice: async (req: AuthRequest, res: Response) => {
        try {
            const { paymentId } = req.params;
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not authenticated' });
            }
            const userId = req.user.id;

            // 1. Validate payment exists and belongs to user
            const transactions = await prismaAny.transactions.findMany({
                where: {
                    payment_gateway_payment_id: paymentId,
                    buyer_id: userId,
                    status: 'SUCCESS'
                },
                include: {
                    notes: {
                        select: {
                            title: true,
                            price_inr: true
                        }
                    }
                }
            });

            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Invoice not found or access denied',
                    code: 'INVOICE_NOT_FOUND'
                });
            }

            const mainTx = transactions[0];

            // 2. Prepare Order Data (God-Level Null Safety)
            const orderData = {
                orderId: mainTx.payment_gateway_order_id || 'ORD-UNKNOWN',
                paymentId: mainTx.payment_gateway_payment_id || 'PAY-UNKNOWN',
                date: mainTx.created_at || new Date(),
                customerName: req.user?.fullName || 'Valued Customer',
                customerEmail: req.user?.email || 'customer@notevault.com',
                paymentMethod: 'Razorpay',
                totalAmount: transactions.reduce((sum: number, t: any) => sum + (Number(t.amount_inr) || 0), 0),
                items: transactions.map((t: any) => ({
                    title: t.notes?.title || 'Unknown Note',
                    price: Number(t.amount_inr) || 0
                }))
            };

            // 3. Generate PDF & Capture Verification Metadata
            const { pdf: pdfBuffer, invoiceId, hash } = await invoiceService.generateInvoice(orderData);

            // 4. PERSISTENCE (The Memory)
            // Update the transaction with the new Invoice Identity
            await prismaAny.transactions.update({
                where: { id: mainTx.id },
                data: {
                    invoice_id: invoiceId,
                    invoice_hash: hash,
                    invoice_generated_at: new Date()
                }
            });

            // 5. Send Response
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${paymentId}.pdf`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Download invoice error:', error);
            try {
                const fs = require('fs');
                const path = require('path');
                const logFile = path.join(process.cwd(), 'invoice_error.log');
                const msg = `[${new Date().toISOString()}] Error: ${error instanceof Error ? error.stack : String(error)}\n`;
                fs.appendFileSync(logFile, msg);
            } catch (e) { /* ignore log error */ }

            return res.status(500).json({
                success: false,
                message: 'Failed to generate invoice',
                code: 'INVOICE_GENERATION_ERROR',
                error: String(error)
            });
        }
    }
};

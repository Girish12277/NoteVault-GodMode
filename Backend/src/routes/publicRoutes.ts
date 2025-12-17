import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();
const prismaAny = prisma as any;

/**
 * GET /api/public/verify/invoice/:invoiceId
 * Public endpoint to verify cryptographic invoice signatures.
 * 
 * Rules:
 * 1. Open to public (No Auth).
 * 2. Strict Rate Limiting (handled by global middleware).
 * 3. Privacy Preservation: Never return full email or phone.
 */
router.get('/verify/invoice/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { sig } = req.query;

        if (!invoiceId || !sig) {
            return res.status(400).json({
                success: false,
                message: 'Missing verification parameters',
                code: 'INVALID_REQUEST'
            });
        }

        // 1. Lookup Anchor Transaction by Invoice ID
        const anchorTransaction = await prismaAny.transactions.findUnique({
            where: { invoice_id: invoiceId },
            include: {
                users_transactions_buyer_idTousers: {
                    select: { full_name: true }
                }
            }
        });

        if (!anchorTransaction) {
            // Anti-Enumeration: Delay response slightly? 
            // For now, standard 404 is fine as IDs are high entropy.
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
                code: 'NOT_FOUND'
            });
        }

        // 2. Cryptographic Check (The Core Security)
        // The signature passed in might be truncated (e.g. 12 chars), so we check startsWith
        // OR if full hash is passed, we check equality.
        // Our Generator produces: ?sig=HASH.substring(0, 12)

        const storedHash = anchorTransaction.invoice_hash || '';
        const providedSig = String(sig);

        // Security Policy: We require at least 12 chars to prevent easy collision attacks
        if (providedSig.length < 12) {
            return res.status(400).json({
                success: false,
                message: 'Signature format invalid (too short)',
                code: 'INVALID_SIG'
            });
        }

        if (!storedHash.startsWith(providedSig)) {
            return res.status(400).json({
                success: false,
                message: 'Cryptographic signature mismatch. Verification Failed.',
                code: 'SIG_MISMATCH'
            });
        }

        // 3. Aggregation (The Fix for Bulk Orders)
        // Fetches all siblings to calculate the TRUE Invoice Total
        const allTransactions = await prismaAny.transactions.findMany({
            where: {
                payment_gateway_order_id: anchorTransaction.payment_gateway_order_id
            },
            include: {
                notes: {
                    select: { title: true }
                }
            }
        });

        const totalAmount = allTransactions.reduce((sum: number, t: any) => sum + Number(t.amount_inr || 0), 0);

        let displayTitle = 'Digital Content';
        if (allTransactions.length === 1) {
            displayTitle = allTransactions[0].notes?.title || 'Unknown Note';
        } else {
            // "Bundle Order (3 Items): Math, Physics..."
            displayTitle = `Bundle Order (${allTransactions.length} Items)`;
        }

        // 4. Privacy Masking
        const buyerName = anchorTransaction.users_transactions_buyer_idTousers?.full_name || 'Unknown';
        const maskedName = buyerName.length > 2
            ? `${buyerName[0]}***${buyerName[buyerName.length - 1]}`
            : `${buyerName[0]}***`;

        // 5. Return Verified Data
        return res.json({
            success: true,
            data: {
                isValid: true,
                invoiceId: anchorTransaction.invoice_id,
                issuedAt: anchorTransaction.invoice_generated_at || anchorTransaction.created_at,
                amount: totalAmount, // Verified Sum
                status: anchorTransaction.status,
                buyerRef: maskedName,
                issuer: 'NoteVault Inc.',
                item: {
                    title: displayTitle,
                    type: allTransactions.length > 1 ? 'Educational Bundle' : 'Educational Material'
                }
            }
        });

    } catch (error) {
        console.error('Invoice verification error:', error);
        res.status(500).json({ success: false, message: 'Verification System Error' });
    }
});

export default router;

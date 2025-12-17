import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prismaAny = prisma as any;

// SECURITY PROTOCOL: CHAT PROFILE VISIBILITY
// This endpoint powers the ChatUserProfile panel.
// It enforces strict role-based visibility rules.
router.get('/:userId/chat-profile', authenticate, async (req: AuthRequest, res) => {
    const viewerId = req.user?.id;
    const { userId: targetId } = req.params;

    if (!viewerId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
        // 1. Fetch Viewer & Target Roles
        const [viewer, target] = await Promise.all([
            prismaAny.users.findUnique({ where: { id: viewerId }, select: { is_seller: true } }),
            prismaAny.users.findUnique({
                where: { id: targetId },
                select: {
                    id: true,
                    full_name: true,
                    profile_picture_url: true,
                    is_seller: true,
                    email: true, // FETCHED BUT FILTERED LATER
                    created_at: true,
                    is_verified: true,
                    university_id: true,
                    universities: { select: { id: true, name: true } }
                }
            })
        ]);

        if (!target) return res.status(404).json({ success: false, message: 'User not found' });

        const isViewerSeller = viewer?.is_seller;
        const isTargetSeller = target.is_seller;

        // 2. PERMISSION MATRIX ENFORCEMENT
        // Rule: Seller -> Buyer (Email OK - Logged)
        // Rule: Buyer -> Seller (Email NO)
        // Rule: Buyer -> Buyer (Email NO)

        let showEmail = false;

        // Logic: Only a Seller can see a Buyer's email (for order contact/verification)
        // A Buyer can NEVER see a Seller's email (privacy)
        if (isViewerSeller && !isTargetSeller) {
            showEmail = true;
        }

        // 3. AUDIT LOGGING (MANDATORY - DB WRITE)
        if (showEmail) {
            // FIRE AND FORGET to minimalize latency, but ensure execution.
            // Using separate promise handler.
            prismaAny.chatAudit.create({
                data: {
                    viewer_user_id: viewerId,
                    target_user_id: targetId,
                    field_accessed: 'email',
                    timestamp: new Date()
                }
            }).catch((err: any) => console.error('AUDIT FAILURE:', err));
        }

        // 4. CONSTRUCT SAFE RESPONSE
        const responseData = {
            user_id: target.id,
            display_name: target.full_name,
            avatar_url: target.profile_picture_url,
            role: target.is_seller ? 'seller' : 'buyer',
            // Strict Email Visibility
            email: showEmail ? target.email : null,
            // University Context
            university: target.universities ? {
                id: target.universities.id,
                name: target.universities.name
            } : null,
            joined_at: target.created_at,
            trust_flags: {
                student_verified: !!target.university_id, // Proxy for verification
                email_verified: target.is_verified || false
            }
        };

        return res.json({ success: true, data: responseData });

    } catch (error) {
        console.error('Chat Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch chat profile' });
    }
});

export default router;

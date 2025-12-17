import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadPostImage } from '../middleware/upload';
import crypto from 'crypto';

const router = Router();

// Create a Post
router.post('/', authenticate, uploadPostImage, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Check if seller
        const user = await prisma.users.findUnique({ where: { id: userId } });
        if (!user?.is_seller) return res.status(403).json({ success: false, message: 'Only sellers can post' });

        const { content, linkUrl } = req.body;
        // If image uploaded via multer/cloudinary middleware, it would be in req.file.path
        // Assuming current upload middleware puts url in req.file.path or we handle it similarly to note upload
        const imageUrl = req.file ? req.file.path : undefined;

        // NOTE: The user asked for "text link photo". 
        // If the frontend uses the existing /upload/preview endpoint for images, we might receive imageUrl in body.
        // Let's support both or check body.imageUrl too.
        const finalImageUrl = imageUrl || req.body.imageUrl;

        const post = await prisma.posts.create({
            data: {
                id: crypto.randomUUID(),
                seller_id: userId,
                content,
                link_url: linkUrl,
                image_url: finalImageUrl
            }
        });

        return res.json({ success: true, data: post });
    } catch (error) {
        console.error('Create post error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create post' });
    }
});

// Delete a Post
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const post = await prisma.posts.findUnique({ where: { id } });
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        if (post.seller_id !== userId) return res.status(403).json({ success: false, message: 'Not owner' });

        await prisma.posts.delete({ where: { id } });

        return res.json({ success: true, message: 'Post deleted' });

    } catch (error) {
        console.error('Delete post error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete post' });
    }
});

// Get Posts for a Seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const { sellerId } = req.params;
        const posts = await prisma.posts.findMany({
            where: { seller_id: sellerId },
            orderBy: { created_at: 'desc' }
        });
        return res.json({ success: true, data: posts });
    } catch (error) {
        console.error('Get seller posts error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch posts' });
    }
});

export default router;

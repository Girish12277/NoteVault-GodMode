import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { generateSignedDownloadUrl } from '../services/uploadService';

const prismaAny = prisma as any;

/**
 * Download Controller
 * Handles secure file download URL generation with Cloudinary signed URLs
 */
export const downloadController = {
    /**
     * GET /api/download/note/:id
     * Stream PDF directly through backend server
     * This bypasses ALL Cloudinary ACL restrictions
     */
    streamNoteDownload: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;

            console.log(`[Download] Starting Redirect Flow - Note: ${id}, User: ${userId}`);

            // STEP 1: Fetch note
            const note = await prismaAny.notes.findUnique({
                where: { id },
                select: { id: true, title: true, file_url: true, seller_id: true, is_active: true, is_deleted: true }
            });

            if (!note || note.is_deleted || !note.is_active) {
                return res.status(404).json({ success: false, message: 'Note not found or unavailable' });
            }

            // STEP 2: Authorization
            const isOwner = note.seller_id === userId;
            const purchase = await prismaAny.purchases.findFirst({
                where: { user_id: userId, note_id: id, is_active: true }
            });

            if (!isOwner && !purchase) {
                console.log(`[Download] 403 Forbidden - No purchase`);
                return res.status(403).json({ success: false, message: 'Purchase required' });
            }

            // STEP 3: Generate Signed URL (Robust Logic)
            const fileUrl = note.file_url;
            if (!fileUrl) {
                console.error('[Download] Error: No file_url for note', id);
                return res.status(500).json({ success: false, message: 'File URL missing' });
            }

            const urlPattern = /\/raw\/(upload|authenticated|download)\/(.+)$/;
            const match = fileUrl.match(urlPattern);

            if (!match) {
                console.error(`[Download] Invalid URL format: ${fileUrl}`);
                return res.status(500).json({ success: false, message: 'Invalid file source' });
            }

            let rawType = match[1];
            if (rawType === 'download') rawType = 'upload';

            let relativePath = match[2];
            relativePath = relativePath.replace(/^s--[^/]+--\//, '').replace(/^v\d+\//, '');

            let pidDecoded: string;
            try {
                pidDecoded = decodeURIComponent(relativePath);
            } catch (e) {
                console.error('[Download] URI Decode Failed:', e);
                pidDecoded = relativePath;
            }

            // Import Configured Cloudinary
            const { default: cloudinary } = await import('../config/cloudinary');

            const signedUrl = cloudinary.utils.private_download_url(pidDecoded, '', {
                resource_type: 'raw',
                type: rawType,
                attachment: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });

            if (!signedUrl) {
                console.error('[Download] Failed to sign URL');
                return res.status(500).json({ success: false, message: 'Sign generation failed' });
            }

            // STEP 4: Stats Update (Fire and forget-ish, but waited largely)
            try {
                const updatePromises = [];
                if (purchase) {
                    updatePromises.push(prismaAny.purchases.update({
                        where: { id: purchase.id },
                        data: { download_count: { increment: 1 } }
                    }));
                }
                updatePromises.push(prismaAny.notes.update({
                    where: { id },
                    data: { download_count: { increment: 1 } }
                }));
                await Promise.allSettled(updatePromises);
                console.log('[Download] Stats updated');
            } catch (dbError) {
                console.error('[Download] Stats error (ignored):', dbError);
            }

            console.log('[Download] Redirecting to Cloudinary...');
            // STEP 5: Redirect Client to Cloudinary
            // Axios will follow this and download the file content.
            return res.redirect(signedUrl);

        } catch (error: any) {
            console.error('[Download] CRITICAL ERROR:', error);
            // If headers sent, we can't send json, but usually redirect is the first header write.
            if (!res.headersSent) {
                return res.status(500).json({
                    success: false,
                    message: 'Download processing failed',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    }
};

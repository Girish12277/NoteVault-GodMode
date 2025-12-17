import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { authenticate, requireSeller } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Upload Routes
 * All routes require authentication
 * Note/Preview uploads require Seller role
 */

// POST /api/upload/note - Upload PDF note (Seller only)
router.post(
    '/note',
    authenticate,
    requireSeller,
    uploadLimiter,
    ...uploadController.uploadNoteFile
);

// POST /api/upload/preview - Upload preview image (Seller only)
router.post(
    '/preview',
    authenticate,
    requireSeller,
    uploadLimiter,
    ...uploadController.uploadPreviewImage
);

// POST /api/upload/avatar - Upload user avatar (Any authenticated user)
router.post(
    '/avatar',
    authenticate,
    uploadLimiter,
    ...uploadController.uploadAvatarImage
);

// DELETE /api/upload/:publicId - Delete file (Owner or Admin)
router.delete(
    '/:publicId(*)',  // (*) allows slashes in publicId
    authenticate,
    uploadController.deleteFile
);

// GET /api/upload/signed-url/:publicId - Get signed URL for downloads
router.get(
    '/signed-url/:publicId(*)',
    authenticate,
    uploadController.getSignedUrl
);

export default router;

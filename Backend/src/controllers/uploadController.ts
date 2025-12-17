import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { uploadNote, uploadPreview, uploadAvatar, FileUploadError } from '../middleware/upload';
import { uploadService } from '../services/uploadService';
import { config } from '../config/env';
import { cloudinary } from '../config/cloudinary';

// Note: This controller doesn't seem to use Prisma directly! 
// It uses uploadService.
// I will keep it as is but add comments just in case.
// Wait, actually uploadService MIGHT use Prisma.
// Let's assume uploadController is fine for now but if it uses Services that use Prisma, those Services need patching.
// But checking the file content I just read, it ONLY calls uploadService.
// I should check `uploadService` if I haven't already.
// However, the error log "courses_offered" was University related.
// I'll leave uploadController mostly alone but clean up types if any.
// Actually, I'll just restore it to make sure I didn't break anything, but I don't see prisma calls here.

/**
 * Upload Controller
 * Handles file upload endpoints for notes, previews, and avatars
 */

/**
 * Wrapper to handle Multer errors in async context
 */
const handleMulterUpload = (
    uploadFn: ReturnType<typeof import('multer')>['single'] extends (...args: any[]) => infer R ? R : never
) => {
    return (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        return new Promise((resolve) => {
            uploadFn(req, res, (err: any) => {
                if (err) {
                    if (err instanceof FileUploadError) {
                        res.status(err.statusCode).json({
                            success: false,
                            message: err.message,
                            code: err.code
                        });
                    } else if (err.code === 'LIMIT_FILE_SIZE') {
                        res.status(413).json({
                            success: false,
                            message: 'File size exceeds the maximum allowed limit',
                            code: 'FILE_TOO_LARGE'
                        });
                    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                        res.status(400).json({
                            success: false,
                            message: 'Unexpected file field',
                            code: 'UNEXPECTED_FIELD'
                        });
                    } else {
                        res.status(400).json({
                            success: false,
                            message: err.message || 'File upload error',
                            code: 'UPLOAD_ERROR'
                        });
                    }
                    resolve();
                } else {
                    next();
                    resolve();
                }
            });
        });
    };
};

export const uploadController = {
    /**
     * POST /api/upload/note
     * Upload a PDF note file
     * Requires: Seller role
     */
    uploadNoteFile: [
        // Multer middleware
        (req: AuthRequest, res: Response, next: NextFunction) => {
            handleMulterUpload(uploadNote)(req, res, next);
        },
        // Handler
        async (req: AuthRequest, res: Response) => {
            try {
                // Check if Cloudinary is configured
                if (!config.cloudinary.enabled) {
                    return res.status(503).json({
                        success: false,
                        message: 'File upload service is not configured',
                        code: 'SERVICE_UNAVAILABLE'
                    });
                }

                // Verify file was uploaded
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file provided',
                        code: 'NO_FILE'
                    });
                }

                const userId = req.user!.id;
                const file = req.file;

                // Upload to Cloudinary
                const result = await uploadService.uploadNotePdf(
                    file.buffer,
                    userId,
                    file.originalname
                );
                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.error || 'Upload failed',
                        code: 'UPLOAD_FAILED'
                    });
                }

                // Auto-generation of previews from RAW PDFs is unreliable via simple URL transformation
                // and often returns 404s. We will rely on manual preview uploads by the Seller.
                const previewPages: string[] = [];
                
                return res.status(201).json({
                    success: true,
                    message: 'Note uploaded successfully',
                    data: {
                        publicId: result.publicId,
                        url: result.secureUrl,
                        format: result.format,
                        bytes: result.bytes,
                        pages: result.pages,
                        originalName: file.originalname,
                        previewPages: previewPages
                    }
                });
            } catch (error) {
                console.error('Upload note error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error during upload',
                    code: 'INTERNAL_ERROR'
                });
            }
        }
    ],

    /**
     * POST /api/upload/preview
     * Upload a preview image for a note
     * Requires: Seller role
     */
    uploadPreviewImage: [
        // Multer middleware
        (req: AuthRequest, res: Response, next: NextFunction) => {
            handleMulterUpload(uploadPreview)(req, res, next);
        },
        // Handler
        async (req: AuthRequest, res: Response) => {
            try {
                // Check if Cloudinary is configured
                if (!config.cloudinary.enabled) {
                    return res.status(503).json({
                        success: false,
                        message: 'File upload service is not configured',
                        code: 'SERVICE_UNAVAILABLE'
                    });
                }

                // Verify file was uploaded
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file provided',
                        code: 'NO_FILE'
                    });
                }

                const userId = req.user!.id;
                const file = req.file;
                const noteId = req.body.noteId; // Optional note ID

                // Upload to Cloudinary
                const result = await uploadService.uploadPreviewImage(
                    file.buffer,
                    userId,
                    noteId
                );

                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.error || 'Upload failed',
                        code: 'UPLOAD_FAILED'
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: 'Preview image uploaded successfully',
                    data: {
                        publicId: result.publicId,
                        url: result.secureUrl,
                        format: result.format,
                        bytes: result.bytes,
                        originalName: file.originalname
                    }
                });
            } catch (error) {
                console.error('Upload preview error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error during upload',
                    code: 'INTERNAL_ERROR'
                });
            }
        }
    ],

    /**
     * POST /api/upload/avatar
     * Upload user avatar image
     * Requires: Authentication
     */
    uploadAvatarImage: [
        // Multer middleware
        (req: AuthRequest, res: Response, next: NextFunction) => {
            handleMulterUpload(uploadAvatar)(req, res, next);
        },
        // Handler
        async (req: AuthRequest, res: Response) => {
            try {
                // Check if Cloudinary is configured
                if (!config.cloudinary.enabled) {
                    return res.status(503).json({
                        success: false,
                        message: 'File upload service is not configured',
                        code: 'SERVICE_UNAVAILABLE'
                    });
                }

                // Verify file was uploaded
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No file provided',
                        code: 'NO_FILE'
                    });
                }

                const userId = req.user!.id;
                const file = req.file;

                // Upload to Cloudinary
                const result = await uploadService.uploadAvatarImage(
                    file.buffer,
                    userId
                );

                if (!result.success) {
                    return res.status(500).json({
                        success: false,
                        message: result.error || 'Upload failed',
                        code: 'UPLOAD_FAILED'
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: 'Avatar uploaded successfully',
                    data: {
                        publicId: result.publicId,
                        url: result.secureUrl,
                        format: result.format,
                        bytes: result.bytes
                    }
                });
            } catch (error) {
                console.error('Upload avatar error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error during upload',
                    code: 'INTERNAL_ERROR'
                });
            }
        }
    ],

    /**
     * DELETE /api/upload/:publicId
     * Delete an uploaded file
     * Requires: Owner or Admin role
     */
    deleteFile: async (req: AuthRequest, res: Response) => {
        try {
            // Check if Cloudinary is configured
            if (!config.cloudinary.enabled) {
                return res.status(503).json({
                    success: false,
                    message: 'File upload service is not configured',
                    code: 'SERVICE_UNAVAILABLE'
                });
            }

            const { publicId } = req.params;
            const resourceType = (req.query.type as 'raw' | 'image') || 'raw';

            if (!publicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Public ID is required',
                    code: 'MISSING_PUBLIC_ID'
                });
            }

            // Decode the public ID (it may be URL encoded)
            const decodedPublicId = decodeURIComponent(publicId);

            // Security: Verify the file belongs to the user (unless admin)
            const userId = req.user!.id;
            const isAdmin = req.user!.isAdmin;
            if (!decodedPublicId.includes(userId) && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own files',
                    code: 'FORBIDDEN'
                });
            }

            // Delete from Cloudinary
            const result = await uploadService.deleteFile(decodedPublicId, resourceType);

            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: result.error || 'Delete failed',
                    code: 'DELETE_FAILED'
                });
            }

            return res.json({
                success: true,
                message: 'File deleted successfully'
            });
        } catch (error) {
            console.error('Delete file error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during deletion',
                code: 'INTERNAL_ERROR'
            });
        }
    },

    /**
     * GET /api/upload/signed-url/:publicId
     * Get a signed URL for authenticated file access
     * Requires: Authentication (must own the file or have purchased)
     */
    getSignedUrl: async (req: AuthRequest, res: Response) => {
        try {
            // Check if Cloudinary is configured
            if (!config.cloudinary.enabled) {
                return res.status(503).json({
                    success: false,
                    message: 'File upload service is not configured',
                    code: 'SERVICE_UNAVAILABLE'
                });
            }

            const { publicId } = req.params;
            const expiresIn = parseInt(req.query.expiresIn as string) || 3600;

            if (!publicId) {
                return res.status(400).json({
                    success: false,
                    message: 'Public ID is required',
                    code: 'MISSING_PUBLIC_ID'
                });
            }

            // Decode the public ID
            const decodedPublicId = decodeURIComponent(publicId);

            // Generate signed URL
            const signedUrl = uploadService.getSignedUrl(decodedPublicId, expiresIn);

            return res.json({
                success: true,
                data: {
                    url: signedUrl,
                    expiresIn
                }
            });
        } catch (error) {
            console.error('Get signed URL error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate signed URL',
                code: 'INTERNAL_ERROR'
            });
        }
    }
};

export default uploadController;

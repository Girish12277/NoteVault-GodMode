import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import path from 'path';

/**
 * Multer Configuration for File Uploads
 * Uses memory storage to buffer files before sending to Cloudinary
 */

// Allowed MIME types for different upload types
const ALLOWED_MIME_TYPES = {
    note: ['application/pdf'],
    preview: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
};

// Max file sizes in bytes
const MAX_FILE_SIZES = {
    note: 10 * 1024 * 1024,    // 10MB for PDFs
    preview: 5 * 1024 * 1024,   // 5MB for preview images
    avatar: 2 * 1024 * 1024     // 2MB for avatars
};

/**
 * Custom error class for file upload errors
 */
export class FileUploadError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, code: string = 'FILE_UPLOAD_ERROR', statusCode: number = 400) {
        super(message);
        this.name = 'FileUploadError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

/**
 * File filter for PDF notes
 */
const noteFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.note.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new FileUploadError(
            'Only PDF files are allowed for notes',
            'INVALID_FILE_TYPE'
        ));
    }
};

/**
 * File filter for preview images
 */
const previewFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.preview.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new FileUploadError(
            'Only JPG, PNG, and WebP images are allowed for previews',
            'INVALID_FILE_TYPE'
        ));
    }
};

/**
 * File filter for avatar images
 */
const avatarFileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (ALLOWED_MIME_TYPES.avatar.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new FileUploadError(
            'Only JPG, PNG, and WebP images are allowed for avatars',
            'INVALID_FILE_TYPE'
        ));
    }
};

/**
 * Memory storage configuration
 * Files are stored in memory buffer before uploading to Cloudinary
 */
const storage = multer.memoryStorage();

/**
 * Multer instance for note PDF uploads
 * Max 10MB, PDF only
 */
export const uploadNote = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.note,
        files: 1
    },
    fileFilter: noteFileFilter
}).single('file');

/**
 * Multer instance for preview image uploads
 * Max 5MB, images only
 */
export const uploadPreview = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.preview,
        files: 1
    },
    fileFilter: previewFileFilter
}).single('file');

/**
 * Multer instance for avatar uploads
 * Max 2MB, images only
 */
export const uploadAvatar = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.avatar,
        files: 1
    },
    fileFilter: avatarFileFilter
}).single('file');

/**
 * Multer instance for post image uploads
 * Max 5MB, images only, field name 'image'
 */
export const uploadPostImage = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.preview, // Reuse 5MB limit
        files: 1
    },
    fileFilter: previewFileFilter // Reuse image filter
}).single('image');

/**
 * Multer instance for Note fields (PDF + Cover + Previews)
 */
export const uploadNoteFields = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZES.note, // Max size is checked per file, but this is a global limit for the request if not careful. Multer limits are per file usually but 'fileSize' is per file.
    },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'file') {
            noteFileFilter(req, file, cb);
        } else if (file.fieldname === 'coverImage' || file.fieldname === 'previewImages') {
            previewFileFilter(req, file, cb);
        } else {
            cb(new FileUploadError(`Unexpected field: ${file.fieldname}`, 'UNEXPECTED_FIELD'));
        }
    }
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'previewImages', maxCount: 6 }
]);

/**
 * Generate a safe filename for uploaded files
 */
export const generateSafeFilename = (originalName: string, userId: string): string => {
    const ext = path.extname(originalName).toLowerCase();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${userId}_${timestamp}_${randomStr}${ext}`;
};

/**
 * Get file extension from MIME type
 */
export const getExtensionFromMime = (mimeType: string): string => {
    const mimeToExt: Record<string, string> = {
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp'
    };
    return mimeToExt[mimeType] || 'bin';
};

export { ALLOWED_MIME_TYPES, MAX_FILE_SIZES };

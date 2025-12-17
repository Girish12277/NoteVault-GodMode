import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';

/**
 * Cloudinary Configuration
 * Handles file storage for note PDFs and preview images
 */

// Configure Cloudinary with environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Always use HTTPS
});

/**
 * Test Cloudinary connection
 * Called during server startup to verify credentials
 */
export const testCloudinaryConnection = async (): Promise<boolean> => {
    if (!config.cloudinary.enabled) {
        console.warn('⚠️  Cloudinary not configured - file uploads disabled');
        return false;
    }

    try {
        // Ping Cloudinary API to verify credentials
        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            console.log('✅ Cloudinary connected successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('❌ Cloudinary connection failed:', error);
        return false;
    }
};

/**
 * Upload folder structure in Cloudinary:
 * - studyvault/notes/{userId}/{noteId}.pdf
 * - studyvault/previews/{userId}/{noteId}/preview.jpg
 * - studyvault/avatars/{userId}.jpg
 */
export const CLOUDINARY_FOLDERS = {
    NOTES: 'studyvault/notes',
    PREVIEWS: 'studyvault/previews',
    AVATARS: 'studyvault/avatars'
};

/**
 * Upload options for different file types
 */
export const UPLOAD_OPTIONS = {
    // PDF notes upload settings
    note: {
        resource_type: 'raw' as const, // For non-image files like PDF
        allowed_formats: ['pdf'],
        max_bytes: 10 * 1024 * 1024, // 10MB max
        folder: CLOUDINARY_FOLDERS.NOTES,
        access_mode: 'public' as const, // Changed from 'authenticated' - files are publicly downloadable
        type: 'upload' as const // Changed from 'authenticated'
    },
    // Preview image settings  
    preview: {
        resource_type: 'image' as const,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 5 * 1024 * 1024, // 5MB max
        folder: CLOUDINARY_FOLDERS.PREVIEWS,
        transformation: [
            { width: 800, height: 1200, crop: 'limit' }, // Limit size
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    },
    // Avatar/profile image settings
    avatar: {
        resource_type: 'image' as const,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        max_bytes: 2 * 1024 * 1024, // 2MB max
        folder: CLOUDINARY_FOLDERS.AVATARS,
        transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
};

export { cloudinary };
export default cloudinary;

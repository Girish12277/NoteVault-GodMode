import { cloudinary, CLOUDINARY_FOLDERS, UPLOAD_OPTIONS } from '../config/cloudinary';
import { config } from '../config/env';
import { Readable } from 'stream';

/**
 * Upload Service
 * Handles all file upload operations with Cloudinary
 */

interface UploadResult {
    success: boolean;
    publicId?: string;
    url?: string;
    secureUrl?: string;
    format?: string;
    bytes?: number;
    pages?: number; // For PDFs
    error?: string;
}

interface DeleteResult {
    success: boolean;
    result?: string;
    error?: string;
}

/**
 * Convert buffer to readable stream
 */
const bufferToStream = (buffer: Buffer): Readable => {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
};

/**
 * Upload a PDF note to Cloudinary
 * @param buffer - File buffer from Multer
 * @param userId - Owner's user ID
 * @param filename - Original filename
 */
export const uploadNotePdf = async (
    buffer: Buffer,
    userId: string,
    filename: string
): Promise<UploadResult> => {
    if (!config.cloudinary.enabled) {
        return {
            success: false,
            error: 'Cloudinary is not configured'
        };
    }

    try {
        const publicId = `${CLOUDINARY_FOLDERS.NOTES}/${userId}/${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`;

        return new Promise((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'raw',
                    public_id: publicId,
                    access_mode: 'public', // public access for downloadable PDFs
                    type: 'upload', // upload type for signed URL generation
                    folder: undefined, // Already in publicId path
                    format: 'pdf'
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        resolve({
                            success: false,
                            error: error.message
                        });
                    } else if (result) {
                        resolve({
                            success: true,
                            publicId: result.public_id,
                            url: result.url,
                            secureUrl: result.secure_url,
                            format: result.format,
                            bytes: result.bytes,
                            pages: result.pages
                        });
                    } else {
                        resolve({
                            success: false,
                            error: 'Unknown upload error'
                        });
                    }
                }
            );

            bufferToStream(buffer).pipe(uploadStream);
        });
    } catch (error) {
        console.error('Upload note error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Upload a preview image to Cloudinary
 * @param buffer - File buffer from Multer
 * @param userId - Owner's user ID
 * @param noteId - Associated note ID (optional)
 */
export const uploadPreviewImage = async (
    buffer: Buffer,
    userId: string,
    noteId?: string
): Promise<UploadResult> => {
    if (!config.cloudinary.enabled) {
        return {
            success: false,
            error: 'Cloudinary is not configured'
        };
    }

    try {
        const folderPath = noteId
            ? `${CLOUDINARY_FOLDERS.PREVIEWS}/${userId}/${noteId}`
            : `${CLOUDINARY_FOLDERS.PREVIEWS}/${userId}`;

        const publicId = `${folderPath}/${Date.now()}_preview`;

        return new Promise((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    public_id: publicId,
                    folder: undefined,
                    transformation: UPLOAD_OPTIONS.preview.transformation
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary preview upload error:', error);
                        resolve({
                            success: false,
                            error: error.message
                        });
                    } else if (result) {
                        resolve({
                            success: true,
                            publicId: result.public_id,
                            url: result.url,
                            secureUrl: result.secure_url,
                            format: result.format,
                            bytes: result.bytes
                        });
                    } else {
                        resolve({
                            success: false,
                            error: 'Unknown upload error'
                        });
                    }
                }
            );

            bufferToStream(buffer).pipe(uploadStream);
        });
    } catch (error) {
        console.error('Upload preview error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Upload an avatar image to Cloudinary
 * @param buffer - File buffer from Multer
 * @param userId - User's ID
 */
export const uploadAvatarImage = async (
    buffer: Buffer,
    userId: string
): Promise<UploadResult> => {
    if (!config.cloudinary.enabled) {
        return {
            success: false,
            error: 'Cloudinary is not configured'
        };
    }

    try {
        const publicId = `${CLOUDINARY_FOLDERS.AVATARS}/${userId}`;

        return new Promise((resolve) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'image',
                    public_id: publicId,
                    folder: undefined,
                    overwrite: true, // Replace existing avatar
                    transformation: UPLOAD_OPTIONS.avatar.transformation
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary avatar upload error:', error);
                        resolve({
                            success: false,
                            error: error.message
                        });
                    } else if (result) {
                        resolve({
                            success: true,
                            publicId: result.public_id,
                            url: result.url,
                            secureUrl: result.secure_url,
                            format: result.format,
                            bytes: result.bytes
                        });
                    } else {
                        resolve({
                            success: false,
                            error: 'Unknown upload error'
                        });
                    }
                }
            );

            bufferToStream(buffer).pipe(uploadStream);
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
};

/**
 * Delete a file from Cloudinary
 * @param publicId - Cloudinary public ID
 * @param resourceType - Type of resource ('raw' for PDFs, 'image' for images)
 */
export const deleteFile = async (
    publicId: string,
    resourceType: 'raw' | 'image' = 'raw'
): Promise<DeleteResult> => {
    if (!config.cloudinary.enabled) {
        return {
            success: false,
            error: 'Cloudinary is not configured'
        };
    }

    // SECURITY: Prevent path traversal attacks
    if (!publicId || publicId.trim() === '') {
        return {
            success: false,
            error: 'Invalid public_id: cannot be empty'
        };
    }

    if (publicId.includes('..')) {
        console.error('🔒 SECURITY: Path traversal attempt detected:', publicId);
        return {
            success: false,
            error: 'Invalid public_id: path traversal not allowed'
        };
    }

    if (publicId.includes('\0')) {
        console.error('🔒 SECURITY: Null byte injection attempt detected:', publicId);
        return {
            success: false,
            error: 'Invalid public_id: null bytes not allowed'
        };
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
            type: resourceType === 'raw' ? 'authenticated' : 'upload'
        });

        return {
            success: result.result === 'ok',
            result: result.result
        };
    } catch (error) {
        console.error('Delete file error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed'
        };
    }
};

/**
 * Generate a signed URL for authenticated file access
 * @param publicId - Cloudinary public ID
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 */
export const getSignedUrl = (
    publicId: string,
    expiresIn: number = 3600,
    type: 'upload' | 'authenticated' | 'private' = 'upload',
    version?: string,
    format?: string
): string => {
    const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;

    return cloudinary.url(publicId, {
        resource_type: 'raw',
        type: type, // use provided type
        sign_url: true,
        // flags: 'attachment', // Removed: Not supported for raw files, causes ERR_INVALID_RESPONSE
        version: version ? version.replace(/^v/, '') : undefined, // Explicit version if available, ensuring no double 'v'
        format: format,
        expires_at: expirationTime
    });
};

/**
 * Generate a watermarked URL for PDF downloads
 * Adds a text overlay with the user's email for piracy protection
 * @param publicId - Cloudinary public ID
 * @param userEmail - Buyer's email for watermark
 */
export const getWatermarkedPdfUrl = (
    publicId: string,
    userEmail: string
): string => {
    // For PDFs, we return the signed URL
    // Note: True PDF watermarking requires a more complex solution
    // This is a placeholder for the download URL
    return getSignedUrl(publicId, 3600);
};

/**
 * Generate a signed download URL for Cloudinary files
 * Handles both URL extraction and signing
 * @param fileUrl - Full Cloudinary URL
 * @param expiresIn - Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Signed URL or null if extraction fails
 */
export const generateSignedDownloadUrl = (
    fileUrl: string,
    expiresIn: number = 3600
): string | null => {
    try {
        // Extract public_id from Cloudinary URL
        // Format: https://res.cloudinary.com/{cloud}/raw/{type}/v{version}/{public_id}.{ext}
        const match = fileUrl.match(/\/v\d+\/(.+)$/);
        if (!match || !match[1]) {
            console.error('❌ Invalid Cloudinary URL format:', fileUrl);
            return null;
        }

        const publicIdWithExt = match[1];
        // Remove file extension
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

        console.log('🔐 Generating signed URL for public_id:', publicId);

        // Generate signed URL for public uploaded files
        const signedUrl = cloudinary.url(publicId, {
            resource_type: 'raw',
            type: 'upload', // CRITICAL: Use 'upload' type for public files
            sign_url: true,
            secure: true,
            expires_at: Math.floor(Date.now() / 1000) + expiresIn
        });

        console.log('✅ Signed URL generated successfully');
        return signedUrl;
    } catch (error) {
        console.error('❌ Error generating signed URL:', error);
        return null;
    }
};

/**
 * Get optimized preview image URL with transformations
 * @param publicId - Cloudinary public ID
 * @param width - Target width
 * @param height - Target height
 */
export const getOptimizedImageUrl = (
    publicId: string,
    width: number = 400,
    height: number = 600
): string => {
    return cloudinary.url(publicId, {
        resource_type: 'image',
        transformation: [
            { width, height, crop: 'fill' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    });
};

export const uploadService = {
    uploadNotePdf,
    uploadPreviewImage,
    uploadAvatarImage,
    deleteFile,
    getSignedUrl,
    getWatermarkedPdfUrl,
    getOptimizedImageUrl,
    generateSignedDownloadUrl
};

export default uploadService;

import { uploadNotePdf, uploadPreviewImage, uploadAvatarImage, deleteFile, getSignedUrl, generateSignedDownloadUrl, getOptimizedImageUrl } from '../../../src/services/uploadService';
import { cloudinary, CLOUDINARY_FOLDERS } from '../../../src/config/cloudinary';
import { safeCloudinaryService } from '../../../src/services/cloudinaryCircuitBreaker';
import { alertService } from '../../../src/services/alertService';
import { config } from '../../../src/config/env';

// Mock dependencies
jest.mock('../../../src/config/cloudinary', () => ({
    cloudinary: {
        uploader: {
            upload_stream: jest.fn(),
            destroy: jest.fn()
        },
        url: jest.fn()
    },
    CLOUDINARY_FOLDERS: {
        NOTES: 'notes',
        PREVIEWS: 'previews',
        AVATARS: 'avatars'
    },
    UPLOAD_OPTIONS: {
        preview: { transformation: {} },
        avatar: { transformation: {} }
    }
}));

jest.mock('../../../src/services/cloudinaryCircuitBreaker', () => ({
    safeCloudinaryService: {
        uploadFile: jest.fn(),
        isCircuitOpen: jest.fn().mockReturnValue(false)
    }
}));

jest.mock('../../../src/services/alertService', () => ({
    alertService: {
        sendAlert: jest.fn(),
        critical: jest.fn()
    }
}));

jest.mock('../../../src/config/env', () => ({
    config: {
        cloudinary: {
            enabled: true
        }
    }
}));

describe('Brutal Upload Service Testing', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        config.cloudinary.enabled = true; // Reset enabled state
    });

    describe('uploadNotePdf', () => {
        const buffer = Buffer.from('test-pdf-content');
        const userId = 'user_123';
        const filename = 'test.pdf';

        it('should upload successfully via safeCloudinaryService', async () => {
            const mockResult = {
                public_id: 'test_public_id',
                url: 'http://url.com/file',
                secure_url: 'https://url.com/file',
                format: 'pdf',
                bytes: 1024,
                pages: 5
            };
            (safeCloudinaryService.uploadFile as jest.Mock).mockResolvedValue(mockResult);

            const result = await uploadNotePdf(buffer, userId, filename);

            expect(result.success).toBe(true);
            expect(result.publicId).toBe(mockResult.public_id);
            expect(safeCloudinaryService.uploadFile).toHaveBeenCalled();
        });

        it('should return error if config disabled', async () => {
            config.cloudinary.enabled = false;
            const result = await uploadNotePdf(buffer, userId, filename);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cloudinary is not configured');
        });

        it('should handle upload failures and send alert', async () => {
            const error = new Error('Upload Failed');
            (safeCloudinaryService.uploadFile as jest.Mock).mockRejectedValue(error);

            const result = await uploadNotePdf(buffer, userId, filename);

            expect(result.success).toBe(false);
            expect(alertService.sendAlert).toHaveBeenCalledWith(expect.objectContaining({
                severity: 'HIGH',
                event: 'NOTE_UPLOAD_FAILED'
            }));
        });
    });

    describe('deleteFile', () => {
        it('should delete file successfully', async () => {
            (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

            const result = await deleteFile('some_public_id');
            expect(result.success).toBe(true);
        });

        it('should detect path traversal', async () => {
            const result = await deleteFile('../etc/passwd');
            expect(result.success).toBe(false);
            expect(result.error).toContain('path traversal');
            expect(alertService.critical).toHaveBeenCalled();
        });

        it('should detect null byte injection', async () => {
            const result = await deleteFile('some_id\0hack');
            expect(result.success).toBe(false);
            expect(result.error).toContain('null bytes');
        });

        it('should handle API errors', async () => {
            (cloudinary.uploader.destroy as jest.Mock).mockRejectedValue(new Error('API Error'));
            const result = await deleteFile('id');
            expect(result.success).toBe(false);
        });

        it('should fail if cloudinary disabled', async () => {
            config.cloudinary.enabled = false;
            const result = await deleteFile('id');
            expect(result.success).toBe(false);
        });

        it('should fail on empty id', async () => {
            const result = await deleteFile('');
            expect(result.success).toBe(false);
        });
    });

    describe('generateSignedDownloadUrl', () => {
        it('should extract public_id and generate url', () => {
            (cloudinary.url as jest.Mock).mockReturnValue('https://signed.url');
            // Mock url: https://res.cloudinary.com/cloud/raw/upload/v1234/folder/file.pdf
            const fileUrl = 'https://res.cloudinary.com/demo/raw/upload/v123456789/folder/my_file.pdf';

            const signed = generateSignedDownloadUrl(fileUrl);

            expect(signed).toBe('https://signed.url');
            expect(cloudinary.url).toHaveBeenCalledWith(
                'folder/my_file', // Extracted public id
                expect.objectContaining({ sign_url: true })
            );
        });

        it('should return null for invalid URL format', () => {
            const signed = generateSignedDownloadUrl('invalid_url');
            expect(signed).toBeNull();
        });
    });

    describe('uploadPreviewImage', () => {
        const buffer = Buffer.from('image');
        it('should upload image using stream', async () => {
            // Mock upload_stream implementation to call callback
            (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, cb) => {
                cb(null, {
                    public_id: 'pid',
                    url: 'url',
                    secure_url: 's_url',
                    format: 'jpg',
                    bytes: 100
                });
                return { write: jest.fn(), end: jest.fn(), on: jest.fn(), once: jest.fn(), emit: jest.fn() };
            });

            const result = await uploadPreviewImage(buffer, 'uid');
            expect(result.success).toBe(true);
        });

        it('should handle stream errors', async () => {
            (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, cb) => {
                cb(new Error('Stream Error'), null);
                return { write: jest.fn(), end: jest.fn(), on: jest.fn(), once: jest.fn(), emit: jest.fn() };
            });

            const result = await uploadPreviewImage(buffer, 'uid');
            expect(result.success).toBe(false);
        });

        it('should handle disabled config', async () => {
            config.cloudinary.enabled = false;
            const result = await uploadPreviewImage(buffer, 'uid');
            expect(result.success).toBe(false);
        });
    });

    describe('uploadAvatarImage', () => {
        const buffer = Buffer.from('avatar');
        it('should upload avatar using stream', async () => {
            (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, cb) => {
                cb(null, { public_id: 'pid' });
                return { write: jest.fn(), end: jest.fn(), on: jest.fn(), once: jest.fn(), emit: jest.fn() };
            });
            const result = await uploadAvatarImage(buffer, 'uid');
            expect(result.success).toBe(true);
        });

        it('should handle disabled config', async () => {
            config.cloudinary.enabled = false;
            const result = await uploadAvatarImage(buffer, 'uid');
            expect(result.success).toBe(false);
        });
    });
});

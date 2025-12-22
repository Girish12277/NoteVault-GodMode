// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------

// Mock Config
jest.mock('../../../src/config/env', () => ({
    config: {
        cloudinary: {
            enabled: true
        }
    }
}));

// Mock Upload Service
jest.mock('../../../src/services/uploadService', () => ({
    uploadService: {
        uploadNotePdf: jest.fn(),
        uploadPreviewImage: jest.fn(),
        uploadAvatarImage: jest.fn(),
        deleteFile: jest.fn(),
        getSignedUrl: jest.fn()
    }
}));

// Mock Middleware
jest.mock('../../../src/middleware/upload', () => ({
    uploadNote: jest.fn(),
    uploadPreview: jest.fn(),
    uploadAvatar: jest.fn(),
    FileUploadError: class FileUploadError extends Error {
        statusCode: number;
        code: string;
        constructor(message: string, statusCode: number, code: string) {
            super(message);
            this.statusCode = statusCode;
            this.code = code;
        }
    }
}));

// ------------------------------------------------------------------
// IMPORTS (After Mocks)
// ------------------------------------------------------------------
import { uploadController } from '../../../src/controllers/uploadController';
import { uploadService } from '../../../src/services/uploadService';
import { config } from '../../../src/config/env';

// Type casting for mocks
const mockUploadService = uploadService as any;
const mockConfig = config as any;

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Upload Controller - Brutal Unit Tests', () => {
    let req: any;
    let res: any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockConfig.cloudinary.enabled = true; // Default to enabled

        req = {
            user: { id: 'user-123', isAdmin: false },
            file: {
                buffer: Buffer.from('test-file'),
                originalname: 'test.pdf'
            },
            body: {},
            params: {},
            query: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('Feature Flag Check', () => {
        it('should return 503 if cloudinary is disabled', async () => {
            mockConfig.cloudinary.enabled = false;
            // Access handle directly (index 1)
            const handler = uploadController.uploadNoteFile[1];
            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(503);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'SERVICE_UNAVAILABLE'
            }));
        });
    });

    describe('uploadNoteFile', () => {
        const handler = uploadController.uploadNoteFile[1];

        it('should return 400 if no file provided', async () => {
            req.file = undefined;
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'NO_FILE'
            }));
        });

        it('should return 201 on success', async () => {
            mockUploadService.uploadNotePdf.mockResolvedValue({
                success: true,
                publicId: 'pid',
                secureUrl: 'url',
                format: 'pdf',
                bytes: 100,
                pages: 5
            });

            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    publicId: 'pid',
                    pages: 5
                })
            }));
            expect(mockUploadService.uploadNotePdf).toHaveBeenCalledWith(
                expect.any(Buffer),
                'user-123',
                'test.pdf'
            );
        });

        it('should return 500 on service failure', async () => {
            mockUploadService.uploadNotePdf.mockResolvedValue({
                success: false,
                error: 'Service Error'
            });

            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'UPLOAD_FAILED',
                message: 'Service Error'
            }));
        });

        it('should return 500 on unexpected error', async () => {
            mockUploadService.uploadNotePdf.mockRejectedValue(new Error('Crash'));
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'INTERNAL_ERROR'
            }));
        });
    });

    describe('uploadPreviewImage', () => {
        const handler = uploadController.uploadPreviewImage[1];

        it('should upload preview successfully', async () => {
            req.file.originalname = 'preview.jpg';
            req.body.noteId = 'note-1';

            mockUploadService.uploadPreviewImage.mockResolvedValue({
                success: true,
                publicId: 'prev-id',
                secureUrl: 'p-url',
                format: 'jpg',
                bytes: 50
            });

            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(mockUploadService.uploadPreviewImage).toHaveBeenCalledWith(
                expect.any(Buffer),
                'user-123',
                'note-1'
            );
        });
    });

    describe('uploadAvatarImage', () => {
        const handler = uploadController.uploadAvatarImage[1];

        it('should upload avatar successfully', async () => {
            req.file.originalname = 'avatar.png';

            mockUploadService.uploadAvatarImage.mockResolvedValue({
                success: true,
                publicId: 'av-id',
                secureUrl: 'av-url',
                format: 'png',
                bytes: 20
            });

            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(mockUploadService.uploadAvatarImage).toHaveBeenCalledWith(
                expect.any(Buffer),
                'user-123'
            );
        });
    });

    describe('deleteFile', () => {
        const handler = uploadController.deleteFile;

        beforeEach(() => {
            req.params.publicId = 'notes/user-123/UUID';
            req.query.type = 'raw';
        });

        it('should forbid deletion if not owner and not admin', async () => {
            req.user.id = 'other-user';
            req.user.isAdmin = false;
            // Public ID belongs to user-123, requester is other-user

            await handler(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'FORBIDDEN'
            }));
        });

        it('should allow deletion if owner', async () => {
            req.user.id = 'user-123';
            // publicId has 'user-123' in it
            mockUploadService.deleteFile.mockResolvedValue({ success: true });

            await handler(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
            expect(mockUploadService.deleteFile).toHaveBeenCalledWith('notes/user-123/UUID', 'raw');
        });

        it('should allow deletion if admin', async () => {
            req.user.id = 'admin-user'; // ID doesn't match publicId
            req.user.isAdmin = true;
            mockUploadService.deleteFile.mockResolvedValue({ success: true });

            await handler(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });

        it('should return 500 if delete fails', async () => {
            mockUploadService.deleteFile.mockResolvedValue({ success: false, error: 'Fail' });
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getSignedUrl', () => {
        const handler = uploadController.getSignedUrl;

        it('should return signed url', async () => {
            req.params.publicId = 'pid';
            req.query.expiresIn = '3600';

            mockUploadService.getSignedUrl.mockReturnValue('http://signed');

            await handler(req, res);

            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    url: 'http://signed',
                    expiresIn: 3600
                }
            });
            expect(mockUploadService.getSignedUrl).toHaveBeenCalledWith('pid', 3600);
        });

        it('should return 400 if publicId missing', async () => {
            req.params.publicId = undefined;
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});

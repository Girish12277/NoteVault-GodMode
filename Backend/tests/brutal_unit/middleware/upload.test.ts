// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------
const mockMulterReturn = {
    single: jest.fn(),
    fields: jest.fn()
};

const mockMulter = jest.fn((config) => {
    (mockMulter as any).lastConfig = config; // Expose config for testing
    return mockMulterReturn;
});

(mockMulter as any).memoryStorage = jest.fn();

jest.mock('multer', () => mockMulter);

// ------------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------------
import {
    uploadNote,
    uploadPreview,
    uploadAvatar,
    uploadNoteFields,
    generateSafeFilename,
    getExtensionFromMime,
    FileUploadError
} from '../../../src/middleware/upload';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Upload Middleware - Brutal Unit Tests', () => {

    describe('Helper Functions', () => {
        it('generateSafeFilename should return formatted string', () => {
            const filename = generateSafeFilename('test.pdf', 'user-1');
            expect(filename).toMatch(/^user-1_\d+_[a-z0-9]+\.pdf$/);
        });

        it('getExtensionFromMime should return correct extensions', () => {
            expect(getExtensionFromMime('application/pdf')).toBe('pdf');
            expect(getExtensionFromMime('image/png')).toBe('png');
            expect(getExtensionFromMime('unknown/type')).toBe('bin');
        });
    });

    describe('File Filters (via Mocked Multer)', () => {
        /**
         * We traverse the calls to mockMulter to find the config for each export.
         * Since the file executes top-to-bottom, the order of calls corresponds to:
         * 1. uploadNote
         * 2. uploadPreview
         * 3. uploadAvatar
         * 4. uploadPostImage (reuses logic)
         * 5. uploadNoteFields
         */
        const calls = (mockMulter as any).mock.calls;

        // Helper to test filter
        const testFilter = (filterFn: Function, validMime: string, invalidMime: string) => {
            const req = {};
            const validFile = { mimetype: validMime };
            const invalidFile = { mimetype: invalidMime };
            const cb = jest.fn();

            // Test Valid
            filterFn(req, validFile, cb);
            expect(cb).toHaveBeenCalledWith(null, true);

            cb.mockClear();

            // Test Invalid
            filterFn(req, invalidFile, cb);
            expect(cb).toHaveBeenCalledWith(expect.any(FileUploadError));
            const error = cb.mock.calls[0][0];
            expect(error.code).toBe('INVALID_FILE_TYPE');
        };

        it('uploadNote filter should only allow PDF', () => {
            const config = calls[0][0]; // First call is uploadNote (approx)
            // Verify limits
            expect(config.limits.fileSize).toBe(10 * 1024 * 1024);

            testFilter(config.fileFilter, 'application/pdf', 'image/jpeg');
        });

        it('uploadPreview filter should allow images', () => {
            const config = calls[1][0];
            expect(config.limits.fileSize).toBe(5 * 1024 * 1024);

            testFilter(config.fileFilter, 'image/png', 'application/pdf');
        });

        it('uploadAvatar filter should allow images', () => {
            const config = calls[2][0];
            expect(config.limits.fileSize).toBe(2 * 1024 * 1024);

            testFilter(config.fileFilter, 'image/jpeg', 'application/pdf');
        });

        it('uploadNoteFields filter should handle fields', () => {
            const config = calls[4][0]; // 5th call
            const filter = config.fileFilter;
            const cb = jest.fn();

            // Valid Note
            filter({}, { fieldname: 'file', mimetype: 'application/pdf' }, cb);
            expect(cb).toHaveBeenCalledWith(null, true);
            cb.mockClear();

            // Valid Cover
            filter({}, { fieldname: 'coverImage', mimetype: 'image/jpeg' }, cb);
            expect(cb).toHaveBeenCalledWith(null, true);
            cb.mockClear();

            // Invalid Field
            filter({}, { fieldname: 'unknown', mimetype: 'image/jpeg' }, cb);
            expect(cb).toHaveBeenCalledWith(expect.any(FileUploadError));
            expect(cb.mock.calls[0][0].message).toContain('Unexpected field');
        });
    });
});

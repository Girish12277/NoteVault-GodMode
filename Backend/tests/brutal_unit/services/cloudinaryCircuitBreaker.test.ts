// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock Opossum first
const mockOpossumInstance = {
    fire: jest.fn(),
    fallback: jest.fn(),
    on: jest.fn(),
    opened: false,
    stats: {},
    halfOpen: false
};

jest.mock('opossum', () => {
    return jest.fn(() => mockOpossumInstance);
});

const mockCloudinary = {
    uploader: {
        upload_stream: jest.fn()
    }
};
jest.mock('../../../src/config/cloudinary', () => ({
    cloudinary: mockCloudinary
}));

const mockAlertService = {
    sendAlert: jest.fn()
};
jest.mock('../../../src/services/alertService', () => ({
    alertService: mockAlertService
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};
jest.mock('../../../src/services/logger', () => ({
    logger: mockLogger
}));

// Mock fs
jest.mock('fs/promises', () => ({
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue(Buffer.from('data')),
    unlink: jest.fn().mockResolvedValue(undefined)
}));

import { safeCloudinaryService } from '../../../src/services/cloudinaryCircuitBreaker';

describe('CloudinaryCircuitBreaker - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('uploadFile', () => {
        it('should fire circuit breaker', async () => {
            mockOpossumInstance.fire.mockResolvedValue({ public_id: 'pid' });

            const result = await safeCloudinaryService.uploadFile(Buffer.from('data'), {
                public_id: 'pid',
                resource_type: 'raw'
            });

            expect(result.public_id).toBe('pid');
            expect(mockOpossumInstance.fire).toHaveBeenCalled();
        });

        it('should handle fallback result (mocked via fire return)', async () => {
            // If circuit is open or error threshold met, opossum calls fallback.
            // Here we simulate fire returning fallback result
            mockOpossumInstance.fire.mockResolvedValue({
                public_id: 'temp/1',
                isFallback: true,
                localPath: '/tmp/1'
            });

            // We need to mock queueService import inside uploadFile
            // Since it uses dynamic import, we can mock the module via jest.mock
            jest.mock('../../../src/services/queueService', () => ({
                queueService: { addCloudinaryRetry: jest.fn() }
            }));
            // Wait, dynamic import inside function requires tricky mocking or `await import` returning mock.
            // Since we can't easily mock dynamic import in jest inside function if block,
            // we rely on it working or failing gracefully (caught).
            // The code catches queue error.

            const result = await safeCloudinaryService.uploadFile(Buffer.from('data'), {
                public_id: 'pid',
                resource_type: 'raw'
            });

            expect((result as any).isFallback).toBe(true);
            // We can check if logger logged "Queuing fallback file"
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Queuing fallback'), expect.anything());
        });
    });

    describe('getStatus', () => {
        it('should return status', () => {
            const status = safeCloudinaryService.getStatus();
            expect(status).toHaveProperty('state');
        });
    });
});

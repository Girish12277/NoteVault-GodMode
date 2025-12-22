// @ts-nocheck
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dotenv to prevent real .env loading
jest.mock('dotenv', () => ({
    config: jest.fn()
}));


const mockConfig = jest.fn();
const mockPing = jest.fn();

const mockCloudinary = {
    config: mockConfig,
    api: {
        ping: mockPing
    }
};

jest.mock('cloudinary', () => ({
    v2: mockCloudinary
}));

describe('Config/Cloudinary - Brutal Unit Tests', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.resetModules();
        originalEnv = { ...process.env };
        mockConfig.mockClear();
        mockPing.mockClear();

        // Suppress logs
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    const reImport = () => require('../../../src/config/cloudinary');

    it('should configure cloudinary on load', () => {
        process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
        process.env.CLOUDINARY_API_KEY = 'key';
        process.env.CLOUDINARY_API_SECRET = 'secret';

        reImport();

        expect(mockConfig).toHaveBeenCalledWith({
            cloud_name: 'cloud',
            api_key: 'key',
            api_secret: 'secret',
            secure: true
        });
    });

    it('testConnection should return true on successful ping', async () => {
        process.env.CLOUDINARY_CLOUD_NAME = 'cloud';
        process.env.CLOUDINARY_API_KEY = 'key';
        process.env.CLOUDINARY_API_SECRET = 'secret';

        mockPing.mockResolvedValue({ status: 'ok' });

        const { testCloudinaryConnection } = reImport();
        const result = await testCloudinaryConnection();

        expect(result).toBe(true);
        expect(mockPing).toHaveBeenCalled();
    });

    it('testConnection should return false on failed ping', async () => {
        mockPing.mockResolvedValue({ status: 'error' });
        const { testCloudinaryConnection } = reImport();
        const result = await testCloudinaryConnection();
        expect(result).toBe(false);
    });

    it('testConnection should return false on exception', async () => {
        mockPing.mockRejectedValue(new Error('Network Error'));
        const { testCloudinaryConnection } = reImport();
        const result = await testCloudinaryConnection();
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalled();
    });

    it('testConnection should return false if disabled (missing env)', async () => {
        delete process.env.CLOUDINARY_CLOUD_NAME;

        const { testCloudinaryConnection } = reImport();
        const result = await testCloudinaryConnection(); // Should utilize internal config check

        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not configured'));
        expect(mockPing).not.toHaveBeenCalled();
    });
});

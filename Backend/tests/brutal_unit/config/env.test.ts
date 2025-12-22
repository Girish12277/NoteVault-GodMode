import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dotenv to prevent loading real .env file
jest.mock('dotenv', () => ({
    config: jest.fn()
}));


describe('Config/Env - Brutal Unit Tests', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockExit: any;
    let mockConsoleError: any;
    let mockConsoleWarn: any;
    let mockConsoleLog: any;

    beforeEach(() => {
        jest.resetModules();
        originalEnv = { ...process.env };
        mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`Process.exit called with ${code}`);
        });
        mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => { });
        mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    // Helper to re-import
    const reImport = () => require('../../../src/config/env');

    it('should validate correctly when all required vars are present', () => {
        process.env.DATABASE_URL = 'postgres://locahost';
        process.env.JWT_SECRET = 'secret';

        const { validateEnv } = reImport();

        expect(() => validateEnv()).not.toThrow();
        expect(mockConsoleError).not.toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalled();
    });

    it('should exit process if DATABASE_URL is missing', () => {
        delete process.env.DATABASE_URL;
        process.env.JWT_SECRET = 'secret';

        const { validateEnv } = reImport();

        expect(() => validateEnv()).toThrow('Process.exit called with 1');
        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Missing required'));
        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL'));
    });

    it('should exit process if JWT_SECRET is missing', () => {
        process.env.DATABASE_URL = 'postgres://locahost';
        delete process.env.JWT_SECRET;

        const { validateEnv } = reImport();

        expect(() => validateEnv()).toThrow('Process.exit called with 1');
        expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('JWT_SECRET'));
    });

    it('should warn if recommended vars are missing', () => {
        process.env.DATABASE_URL = 'postgres://locahost';
        process.env.JWT_SECRET = 'secret';
        delete process.env.RAZORPAY_KEY_ID; // Recommended

        const { validateEnv } = reImport();

        expect(() => validateEnv()).not.toThrow(); // Should not exit
        expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Missing recommended'));
        expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('RAZORPAY_KEY_ID'));
    });

    it('should parse config object correctly', () => {
        process.env.PORT = '8080';
        process.env.NODE_ENV = 'production';
        process.env.DATABASE_URL = 'db-url';
        process.env.JWT_SECRET = 'jwt-secret';
        process.env.RAZORPAY_KEY_ID = 'key';
        process.env.RAZORPAY_KEY_SECRET = 'secret';

        const { config, features } = reImport();

        expect(config.port).toBe(8080);
        expect(config.nodeEnv).toBe('production');
        expect(config.razorpay.enabled).toBe(true);
        expect(features.payments).toBe(true);
    });

    it('should set features to false if credentials missing', () => {
        delete process.env.RAZORPAY_KEY_ID;
        delete process.env.CLOUDINARY_CLOUD_NAME;
        delete process.env.SMTP_HOST;

        process.env.DATABASE_URL = 'db';
        process.env.JWT_SECRET = 'jwt';

        const { config, features } = reImport();

        expect(config.razorpay.enabled).toBe(false);
        expect(config.cloudinary.enabled).toBe(false);
        expect(config.smtp.enabled).toBe(false);

        expect(features.payments).toBe(false);
        expect(features.fileUpload).toBe(false);
        expect(features.email).toBe(false);
    });
});

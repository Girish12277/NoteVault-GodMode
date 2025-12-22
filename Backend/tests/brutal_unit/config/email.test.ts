// @ts-nocheck
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockVerify = jest.fn();
const mockTransporter = {
    verify: mockVerify,
    sendMail: jest.fn()
};

const mockCreateTransport = jest.fn().mockReturnValue(mockTransporter);

jest.mock('nodemailer', () => ({
    createTransport: mockCreateTransport
}));

describe('Config/Email - Brutal Unit Tests', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        jest.resetModules();
        originalEnv = { ...process.env };
        mockCreateTransport.mockClear();
        mockVerify.mockClear();

        // Suppress logs
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    const reImport = () => require('../../../src/config/email');

    it('should initialize Gmail transporter', () => {
        process.env.EMAIL_HOST = 'gmail';
        process.env.EMAIL_USER = 'user@gmail.com';
        process.env.EMAIL_PASS = 'pass';

        const { initializeEmailTransporter } = reImport();
        const transporter = initializeEmailTransporter();

        expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
            service: 'gmail',
            auth: { user: 'user@gmail.com', pass: 'pass' }
        }));
        expect(transporter).toBe(mockTransporter);
    });

    it('should initialize SMTP transporter', () => {
        process.env.EMAIL_HOST = 'smtp.example.com';
        process.env.EMAIL_PORT = '587';
        process.env.EMAIL_USER = 'user';
        process.env.EMAIL_PASS = 'pass';
        process.env.EMAIL_SECURE = 'false';

        const { initializeEmailTransporter } = reImport();
        initializeEmailTransporter();

        expect(mockCreateTransport).toHaveBeenCalledWith(expect.objectContaining({
            host: 'smtp.example.com',
            port: 587,
            secure: false
        }));
    });

    it('should return null if config missing', () => {
        delete process.env.EMAIL_HOST;
        const { initializeEmailTransporter } = reImport();
        const result = initializeEmailTransporter();

        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('not configured'));
    });

    it('should handle creation errors', () => {
        process.env.EMAIL_HOST = 'gmail';
        process.env.EMAIL_USER = 'user';
        process.env.EMAIL_PASS = 'pass';

        mockCreateTransport.mockImplementationOnce(() => {
            throw new Error('Init Fail');
        });

        const { initializeEmailTransporter } = reImport();
        const result = initializeEmailTransporter();

        expect(result).toBeNull();
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('failed'), expect.any(Error));
    });

    it('should test connection successfully', async () => {
        process.env.EMAIL_HOST = 'gmail';
        process.env.EMAIL_USER = 'user';
        process.env.EMAIL_PASS = 'pass';

        mockVerify.mockResolvedValue(true);
        mockCreateTransport.mockReturnValue(mockTransporter);

        const { initializeEmailTransporter, testEmailConnection } = reImport();

        // Must init first to set module var
        initializeEmailTransporter();
        const result = await testEmailConnection();

        expect(result).toBe(true);
        expect(mockVerify).toHaveBeenCalled();
    });

    it('should return false if test connection fails', async () => {
        process.env.EMAIL_HOST = 'gmail';
        process.env.EMAIL_USER = 'user';
        process.env.EMAIL_PASS = 'pass';

        mockVerify.mockRejectedValue(new Error('Connect Fail'));

        const { initializeEmailTransporter, testEmailConnection } = reImport();

        initializeEmailTransporter();
        const result = await testEmailConnection();

        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalled();
    });

    it('should return false if transporter not initialized', async () => {
        delete process.env.EMAIL_HOST; // Prevents init
        const { testEmailConnection } = reImport();

        const result = await testEmailConnection();
        expect(result).toBe(false);
    });

    it('transport getter should lazy load', () => {
        process.env.EMAIL_HOST = 'gmail';
        process.env.EMAIL_USER = 'u';
        process.env.EMAIL_PASS = 'p';

        const { getTransporter } = reImport();

        // Initial call creates it
        const t1 = getTransporter();
        expect(mockCreateTransport).toHaveBeenCalledTimes(1);

        // Second call reuses it
        const t2 = getTransporter();
        expect(mockCreateTransport).toHaveBeenCalledTimes(1);
        expect(t1).toBe(t2);
    });
});

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockMultiEmailService = {
    send: jest.fn() as any,
};

jest.mock('../../../src/services/multiProviderEmailService', () => ({
    __esModule: true,
    multiEmailService: mockMultiEmailService
}));

const mockTransporter = {
    sendMail: jest.fn() as any,
};

const mockGetTransporter = jest.fn(() => mockTransporter);

jest.mock('../../../src/config/email', () => ({
    getTransporter: mockGetTransporter,
    EMAIL_CONFIG: { from: { name: 'Test', address: 'test@example.com' } }
}));

import { sendEmail } from '../../../src/services/emailService';

describe('EmailService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should send email using multiProviderEmailService', async () => {
        mockMultiEmailService.send.mockResolvedValue({ success: true, messageId: 'msg_123' });

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            html: '<p>Test</p>'
        });

        expect(result.success).toBe(true);
        expect(mockMultiEmailService.send).toHaveBeenCalled();
        expect(mockGetTransporter).not.toHaveBeenCalled();
    });

    it('should fallback to SMTP if multiProvider fails', async () => {
        mockMultiEmailService.send.mockResolvedValue({ success: false, error: 'Fail' });
        mockTransporter.sendMail.mockResolvedValue({ messageId: 'smtp_123' });

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            html: '<p>Test</p>'
        });

        expect(result.success).toBe(true);
        expect(result.messageId).toBe('smtp_123');
        expect(mockGetTransporter).toHaveBeenCalled();
        expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should return error if both fail', async () => {
        mockMultiEmailService.send.mockResolvedValue({ success: false, error: 'Fail' });
        mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Fail'));

        const result = await sendEmail({
            to: 'test@example.com',
            subject: 'Test',
            html: '<p>Test</p>'
        });

        expect(result.success).toBe(false);
    });
});

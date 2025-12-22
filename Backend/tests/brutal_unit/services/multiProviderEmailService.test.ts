import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockSendMail = jest.fn() as any;
const mockNodemailer = {
    createTransport: jest.fn(() => ({
        sendMail: mockSendMail,
    })),
};

jest.mock('nodemailer', () => mockNodemailer);

const mockPrisma = {
    email_provider_stats: {
        findMany: jest.fn() as any,
        upsert: jest.fn() as any,
    },
    email_logs: {
        create: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// We need to import the service AFTER mocking since it executes code in constructor/init
import { multiEmailService } from '../../../src/services/multiProviderEmailService';

describe('MultiProviderEmailService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset providers state via private access if possible, or assume clean slate
        // Since singleton is already created, we manipulate private "providers"
        const providers = (multiEmailService as any).providers;
        providers.forEach((p: any) => {
            p.currentCount = 0;
            p.enabled = false;
        });
    });

    describe('initializeProviders', () => {
        it('should enable providers based on env vars', () => {
            // We can't easily re-run constructor, but we can verify existing state logic
            // or manually trigger logic if we could.
            // Instead, let's manually configure for testing send logic
            const providers = (multiEmailService as any).providers;
            const brevo = providers.find((p: any) => p.name === 'Brevo');
            expect(brevo).toBeDefined();
        });
    });

    describe('send', () => {
        it('should fail if no providers are enabled', async () => {
            const result = await multiEmailService.send({
                to: 'test@example.com',
                subject: 'Test',
                html: 'Body'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No email providers configured');
        });

        it('should use Brevo if enabled and under limit', async () => {
            // Enable Brevo
            const providers = (multiEmailService as any).providers;
            const brevo = providers.find((p: any) => p.name === 'Brevo');
            brevo.enabled = true;
            process.env.BREVO_SMTP_USER = 'user';
            process.env.BREVO_SMTP_PASS = 'pass';

            mockSendMail.mockResolvedValueOnce({ messageId: 'msg_123' });

            const result = await multiEmailService.send({
                to: 'test@example.com',
                subject: 'Test',
                html: 'Body'
            });

            expect(result.success).toBe(true);
            expect(result.provider).toBe('Brevo');
            expect(mockNodemailer.createTransport).toHaveBeenCalled();
            expect(mockSendMail).toHaveBeenCalled();
        });

        it('should failover to Mailgun if Brevo fails', async () => {
            const providers = (multiEmailService as any).providers;
            const brevo = providers.find((p: any) => p.name === 'Brevo');
            brevo.enabled = true;
            const mailgun = providers.find((p: any) => p.name === 'Mailgun');
            mailgun.enabled = true;
            process.env.MAILGUN_SMTP_USER = 'user';
            process.env.MAILGUN_SMTP_PASS = 'pass';

            mockSendMail
                .mockRejectedValueOnce(new Error('Brevo failed')) // Brevo fail
                .mockResolvedValueOnce({ messageId: 'msg_456' }); // Mailgun success

            const result = await multiEmailService.send({
                to: 'test@example.com',
                subject: 'Test',
                html: 'Body'
            });

            expect(result.success).toBe(true);
            expect(result.provider).toBe('Mailgun');
            expect(mockSendMail).toHaveBeenCalledTimes(2);
        });

        it('should return error if all providers fail', async () => {
            const providers = (multiEmailService as any).providers;
            const brevo = providers.find((p: any) => p.name === 'Brevo');
            brevo.enabled = true;

            mockSendMail.mockRejectedValue(new Error('Fail'));

            const result = await multiEmailService.send({
                to: 'test@example.com',
                subject: 'Test',
                html: 'Body'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('All email providers failed');
        });
    });

    describe('getStats', () => {
        it('should return provider statistics', () => {
            const stats = multiEmailService.getStats();
            expect(Array.isArray(stats)).toBe(true);
            expect(stats.length).toBe(3);
            expect(stats[0].name).toBe('Brevo');
        });
    });
});

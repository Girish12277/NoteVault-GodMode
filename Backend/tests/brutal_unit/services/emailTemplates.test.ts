import { describe, it, expect } from '@jest/globals';
import { emailTemplates } from '../../../src/services/emailTemplates';

describe('EmailTemplates - Brutal Unit Tests', () => {
    it('should generate welcome email', () => {
        const result = emailTemplates.welcome({ userName: 'Test', email: 't@t.com' });
        expect(result.html).toContain('Welcome, Test!');
        expect(result.subject).toContain('Welcome to StudyVault');
    });

    it('should generate password reset email', () => {
        const result = emailTemplates.passwordReset({
            userName: 'Test',
            resetLink: 'http://reset',
            expiresIn: '1 hour'
        });
        expect(result.html).toContain('Reset Password');
        expect(result.html).toContain('http://reset');
    });

    it('should generate purchase confirmation email', () => {
        const result = emailTemplates.purchaseConfirmation({
            userName: 'Test',
            noteTitle: 'Note 1',
            noteId: 'n1',
            amount: 100,
            transactionId: 'txn',
            downloadLink: 'http://dl'
        });
        expect(result.html).toContain('Purchase Confirmed');
        expect(result.html).toContain('Note 1');
    });

    it('should generate sale notification email', () => {
        const result = emailTemplates.saleNotification({
            sellerName: 'Seller',
            noteTitle: 'Note 1',
            buyerName: 'Buyer',
            amount: 100,
            earnings: 90
        });
        expect(result.html).toContain('You made a sale!');
        expect(result.html).toContain('Note 1');
    });
});

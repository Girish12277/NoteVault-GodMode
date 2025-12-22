import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockPrisma = {
    notes: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
    },
    users: {
        update: jest.fn() as any,
    },
    $transaction: jest.fn((cb: any) => cb({
        deleted_notes_archive: { create: jest.fn() },
        notes: { update: jest.fn() },
        moderation_actions: { create: jest.fn() }
    })) as any,
    copyright_claims: {
        create: jest.fn() as any,
        update: jest.fn() as any,
        count: jest.fn() as any,
    },
    moderation_appeals: {
        create: jest.fn() as any,
        count: jest.fn() as any,
    },
    moderation_actions: {
        count: jest.fn() as any,
        findMany: jest.fn() as any,
    },
    deleted_notes_archive: {
        count: jest.fn() as any,
    }
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

const mockRefundService = {
    initiateRefund: jest.fn() as any,
};
jest.mock('../../../src/services/refundService', () => ({
    RefundService: mockRefundService,
    RefundReason: { OTHER: 'OTHER' }
}));

const mockEmailService = {
    sendEmail: jest.fn() as any,
};
jest.mock('../../../src/services/emailService', () => ({
    __esModule: true,
    default: mockEmailService
}));

jest.mock('../../../src/services/whatsappService', () => ({
    whatsappService: { sendMessage: jest.fn() }
}));

import { contentModerationService } from '../../../src/services/contentModerationService';

describe('ContentModerationService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('safeDeleteNote', () => {
        it('should safely delete note (Phase 4 workflow)', async () => {
            const noteData = {
                id: 'note_1',
                title: 'Test',
                is_deleted: false,
                seller_id: 's1',
                seller_earning_inr: '100',
                transactions: [],
                purchases: [],
                users: { email: 'seller@test.com', full_name: 'Seller' }
            };
            (mockPrisma.notes.findUnique as any).mockResolvedValue(noteData);

            const result = await contentModerationService.safeDeleteNote({
                noteId: 'note_1',
                adminId: 'admin',
                reason: 'spam'
            });

            expect(result.success).toBe(true);
            expect(mockPrisma.$transaction).toHaveBeenCalled();
            expect(mockEmailService.sendEmail).toHaveBeenCalled();
        });

        it('should process refunds if purchases exist', async () => {
            const noteData = {
                id: 'note_1',
                title: 'Test',
                is_deleted: false,
                seller_id: 's1',
                seller_earning_inr: '100',
                transactions: [],
                purchases: [
                    {
                        id: 'p1', user_id: 'u1', transaction_id: 'txn1', amount_paid: '50',
                        users: { email: 'buyer@test.com' }
                    }
                ],
                users: { email: 'seller@test.com' }
            };
            (mockPrisma.notes.findUnique as any).mockResolvedValue(noteData);
            mockRefundService.initiateRefund.mockResolvedValue({ success: true });

            const result = await contentModerationService.safeDeleteNote({
                noteId: 'note_1',
                adminId: 'admin',
                reason: 'spam'
            });

            expect(result.purchasesRefunded).toBe(1);
            expect(mockRefundService.initiateRefund).toHaveBeenCalled();
        });
    });

    describe('handleCopyrightClaim', () => {
        it('should handle claim', async () => {
            (mockPrisma.copyright_claims.create as any).mockResolvedValue({ id: 'c1' });
            (mockPrisma.notes.findUnique as any).mockResolvedValue({ users: { email: 's@t.com' } });

            const result = await contentModerationService.handleCopyrightClaim({
                noteId: 'n1',
                claimantEmail: 'c@c.com',
                description: 'copy'
            });

            expect(result.success).toBe(true);
            expect(mockPrisma.copyright_claims.create).toHaveBeenCalled();
        });
    });
});

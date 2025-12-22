import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockContentModerationService = {
    safeDeleteNote: jest.fn() as any,
    handleCopyrightClaim: jest.fn() as any,
    getModerationStats: jest.fn() as any,
    submitAppeal: jest.fn() as any,
};

const mockPrisma = {
    Report: {
        findMany: jest.fn() as any,
    },
};

jest.mock('../../../src/services/contentModerationService', () => ({
    __esModule: true,
    contentModerationService: mockContentModerationService
}));

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { moderationController } from '../../../src/controllers/moderationController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('ModerationController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, body?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'admin_123' } as any, body: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('safeDeleteNote', () => {
        it('should delete note with refunds successfully', async () => {
            req.body = {
                noteId: 'note_1',
                reason: 'Contains copyrighted material without permission',
                reasonCategory: 'COPYRIGHT'
            };

            (mockContentModerationService.safeDeleteNote as any).mockResolvedValue({
                success: true,
                purchasesRefunded: 5,
                totalRefunded: 2500
            });

            await moderationController.safeDeleteNote(req as any, res as Response);

            expect(mockContentModerationService.safeDeleteNote).toHaveBeenCalledWith({
                noteId: 'note_1',
                adminId: 'admin_123',
                reason: 'Contains copyrighted material without permission',
                reasonCategory: 'COPYRIGHT'
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: {
                    purchasesRefunded: 5,
                    totalRefunded: 2500
                }
            }));
        });

        it('should return 400 if reason too short', async () => {
            req.body = {
                noteId: 'note_1',
                reason: 'Bad' // < 10 characters
            };

            await moderationController.safeDeleteNote(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid request data',
                details: expect.any(Array)
            }));
        });

        it('should return 400 if noteId missing', async () => {
            req.body = {
                reason: 'This lacks a noteId field and should fail'
            };

            await moderationController.safeDeleteNote(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 500 if service fails', async () => {
            req.body = {
                noteId: 'note_1',
                reason: 'Valid reason for deletion'
            };

            (mockContentModerationService.safeDeleteNote as any).mockResolvedValue({
                success: false,
                error: 'Refund processing failed'
            });

            await moderationController.safeDeleteNote(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Refund processing failed'
            }));
        });

        it('should validate reasonCategory enum', async () => {
            req.body = {
                noteId: 'note_1',
                reason: 'Valid reason',
                reasonCategory: 'INVALID_CATEGORY'
            };

            await moderationController.safeDeleteNote(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    describe('fileCopyrightClaim', () => {
        it('should file copyright claim successfully', async () => {
            req.body = {
                noteId: 'note_1',
                claimantEmail: 'copyright@example.com',
                claimantName: 'Copyright Holder',
                description: 'This note contains my copyrighted material from my textbook published in 2020.'
            };

            (mockContentModerationService.handleCopyrightClaim as any).mockResolvedValue({
                success: true,
                claimId: 'claim_123'
            });

            await moderationController.fileCopyrightClaim(req as any, res as Response);

            expect(mockContentModerationService.handleCopyrightClaim).toHaveBeenCalledWith(
                expect.objectContaining({
                    noteId: 'note_1',
                    claimantEmail: 'copyright@example.com'
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { claimId: 'claim_123' }
            }));
        });

        it('should return 400 if email invalid', async () => {
            req.body = {
                noteId: 'note_1',
                claimantEmail: 'not-an-email',
                description: 'Long enough description that meets the minimum character requirement for claims'
            };

            await moderationController.fileCopyrightClaim(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 400 if description too short', async () => {
            req.body = {
                noteId: 'note_1',
                claimantEmail: 'valid@email.com',
                description: 'Too short' // < 50 chars
            };

            await moderationController.fileCopyrightClaim(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should validate URL fields', async () => {
            req.body = {
                noteId: 'note_1',
                claimantEmail: 'valid@email.com',
                description: 'Valid description that is long enough to pass the fifty character minimum requirement',
                proofUrl: 'not-a-url'
            };

            await moderationController.fileCopyrightClaim(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    describe('getStats', () => {
        it('should return moderation statistics', async () => {
            const mockStats = {
                totalDeleted: 10,
                totalRefunded: 50000,
                pendingReports: 5,
                copyrightClaims: 3
            };

            (mockContentModerationService.getModerationStats as any).mockResolvedValue(mockStats);

            await moderationController.getStats(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockStats
            }));
        });

        it('should return 500 if stats fetch fails', async () => {
            (mockContentModerationService.getModerationStats as any).mockResolvedValue(null);

            await moderationController.getStats(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });

        it('should return 500 on service error', async () => {
            (mockContentModerationService.getModerationStats as any).mockRejectedValue(new Error('DB Error'));

            await moderationController.getStats(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('submitAppeal', () => {
        it('should submit appeal successfully', async () => {
            req.body = {
                moderationActionId: 'action_123',
                appealReason: 'This deletion was unjustified because the content was my own original work'
            };

            (mockContentModerationService.submitAppeal as any).mockResolvedValue({
                success: true,
                appealId: 'appeal_456'
            });

            await moderationController.submitAppeal(req as any, res as Response);

            expect(mockContentModerationService.submitAppeal).toHaveBeenCalledWith(
                expect.objectContaining({
                    moderationActionId: 'action_123',
                    sellerId: 'admin_123'
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: { appealId: 'appeal_456' }
            }));
        });

        it('should return 400 if appeal reason too short', async () => {
            req.body = {
                moderationActionId: 'action_123',
                appealReason: 'Short' // < 50 chars
            };

            await moderationController.submitAppeal(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should validate evidenceUrl format', async () => {
            req.body = {
                moderationActionId: 'action_123',
                appealReason: 'Valid appeal reason that meets the minimum character length requirement',
                evidenceUrl: 'not-a-url'
            };

            await moderationController.submitAppeal(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });
    });

    describe('getPendingReports', () => {
        it('should return pending reports with note and user details', async () => {
            const mockReports = [
                {
                    id: 'report_1',
                    status: 'PENDING',
                    notes: { id: 'note_1', title: 'Test Note', seller_id: 'seller_1' },
                    users: { id: 'reporter_1', full_name: 'John Doe', email: 'john@example.com' }
                }
            ];

            (mockPrisma.Report.findMany as any).mockResolvedValue(mockReports);

            await moderationController.getPendingReports(req as any, res as Response);

            expect(mockPrisma.Report.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'PENDING' },
                    take: 50
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: mockReports
            }));
        });

        it('should limit results to 50 reports', async () => {
            (mockPrisma.Report.findMany as any).mockResolvedValue([]);

            await moderationController.getPendingReports(req as any, res as Response);

            expect(mockPrisma.Report.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ take: 50 })
            );
        });

        it('should return 500 on database error', async () => {
            (mockPrisma.Report.findMany as any).mockRejectedValue(new Error('Query failed'));

            await moderationController.getPendingReports(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});

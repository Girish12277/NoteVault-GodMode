import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    notes: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
    },
    purchases: {
        findFirst: jest.fn() as any,
        update: jest.fn() as any,
    },
};

const mockCloudinary = {
    utils: {
        private_download_url: jest.fn() as any
    }
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

jest.mock('../../../src/config/cloudinary', () => ({
    __esModule: true,
    default: mockCloudinary
}));

// Import Controller
import { downloadController } from '../../../src/controllers/downloadController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('DownloadController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, params?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let redirectMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        redirectMock = jest.fn();

        req = {
            user: { id: 'user_123' } as any,
            params: {}
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
            redirect: redirectMock as any,
        };
    });

    describe('streamNoteDownload', () => {
        it('should return 404 if note not found', async () => {
            req.params = { id: 'nonexistent_note' };
            (mockPrisma.notes.findUnique as any).mockResolvedValue(null);

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('not found')
            }));
        });

        it('should return 404 if note is deleted', async () => {
            req.params = { id: 'note_1' };
            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_1',
                is_deleted: true,
                is_active: true
            });

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should return 404 if note is inactive', async () => {
            req.params = { id: 'note_1' };
            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_1',
                is_deleted: false,
                is_active: false
            });

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should allow owner to download without purchase', async () => {
            req.params = { id: 'note_owner' };
            req.user!.id = 'seller_123';

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_owner',
                seller_id: 'seller_123',
                is_active: true,
                is_deleted: false,
                file_url: 'https://res.cloudinary.com/cloud/raw/upload/notes/file.pdf'
            });

            (mockCloudinary.utils.private_download_url as any).mockReturnValue(
                'https://res.cloudinary.com/signed-url'
            );

            (mockPrisma.notes.update as any).mockResolvedValue({});

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(redirectMock).toHaveBeenCalledWith('https://res.cloudinary.com/signed-url');
            expect(statusMock).not.toHaveBeenCalledWith(403);
        });

        it('should return 403 if user has not purchased and is not owner', async () => {
            req.params = { id: 'note_restricted' };
            req.user!.id = 'buyer_456';

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_restricted',
                seller_id: 'seller_789',
                is_active: true,
                is_deleted: false
            });

            (mockPrisma.purchases.findFirst as any).mockResolvedValue(null); // No purchase

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Purchase required'
            }));
        });

        it('should allow download if user has purchased', async () => {
            req.params = { id: 'note_purchased' };
            req.user!.id = 'buyer_456';

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_purchased',
                seller_id: 'seller_789',
                is_active: true,
                is_deleted: false,
                file_url: 'https://res.cloudinary.com/cloud/raw/upload/notes/file.pdf'
            });

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({
                id: 'purchase_1',
                user_id: 'buyer_456',
                note_id: 'note_purchased',
                is_active: true
            });

            (mockCloudinary.utils.private_download_url as any).mockReturnValue(
                'https://res.cloudinary.com/signed-url'
            );

            (mockPrisma.purchases.update as any).mockResolvedValue({});
            (mockPrisma.notes.update as any).mockResolvedValue({});

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(redirectMock).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalledWith(403);
        });

        it('should return 500 if file_url is missing', async () => {
            req.params = { id: 'note_no_url' };

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_no_url',
                seller_id: req.user!.id,
                is_active: true,
                is_deleted: false,
                file_url: null
            });

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: 'File URL missing'
            }));
        });

        it('should increment download counts for note and purchase', async () => {
            req.params = { id: 'note_stats' };
            req.user!.id = 'buyer_123';

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_stats',
                seller_id: 'seller_999',
                is_active: true,
                is_deleted: false,
                file_url: 'https://res.cloudinary.com/cloud/raw/upload/notes/file.pdf'
            });

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({
                id: 'purchase_stats',
                user_id: 'buyer_123',
                note_id: 'note_stats'
            });

            (mockCloudinary.utils.private_download_url as any).mockReturnValue('https://signed-url');
            (mockPrisma.purchases.update as any).mockResolvedValue({});
            (mockPrisma.notes.update as any).mockResolvedValue({});

            await downloadController.streamNoteDownload(req as any, res as Response);

            expect(mockPrisma.purchases.update).toHaveBeenCalledWith({
                where: { id: 'purchase_stats' },
                data: { download_count: { increment: 1 } }
            });

            expect(mockPrisma.notes.update).toHaveBeenCalledWith({
                where: { id: 'note_stats' },
                data: { download_count: { increment: 1 } }
            });
        });

        it('should generate signed URL with 1-hour expiry', async () => {
            req.params = { id: 'note_expiry' };

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_expiry',
                seller_id: req.user!.id,
                is_active: true,
                is_deleted: false,
                file_url: 'https://res.cloudinary.com/cloud/raw/upload/notes/file.pdf'
            });

            const nowSeconds = Math.floor(Date.now() / 1000);
            (mockCloudinary.utils.private_download_url as any).mockReturnValue('https://signed');
            (mockPrisma.notes.update as any).mockResolvedValue({});

            await downloadController.streamNoteDownload(req as any, res as Response);

            const callArgs = (mockCloudinary.utils.private_download_url as any).mock.calls[0];
            expect(callArgs[2].expires_at).toBeGreaterThan(nowSeconds);
            expect(callArgs[2].expires_at).toBeLessThan(nowSeconds + 3700); // ~1 hour
        });

        it('should handle stats update errors gracefully (ignored)', async () => {
            req.params = { id: 'note_stats_error' };

            (mockPrisma.notes.findUnique as any).mockResolvedValue({
                id: 'note_stats_error',
                seller_id: req.user!.id,
                is_active: true,
                is_deleted: false,
                file_url: 'https://res.cloudinary.com/cloud/raw/upload/notes/file.pdf'
            });

            (mockCloudinary.utils.private_download_url as any).mockReturnValue('https://signed');
            (mockPrisma.notes.update as any).mockRejectedValue(new Error('DB Error'));

            await downloadController.streamNoteDownload(req as any, res as Response);

            // Should still redirect despite stats error
            expect(redirectMock).toHaveBeenCalled();
        });
    });
});

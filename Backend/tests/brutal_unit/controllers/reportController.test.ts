import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    report: {
        create: jest.fn() as any,
        findMany: jest.fn() as any,
        count: jest.fn() as any,
        update: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { reportController } from '../../../src/controllers/reportController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Report Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, body?: any, params?: any, query?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'user_123' } as any, body: {}, params: {}, query: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('create', () => {
        it('should create report for note', async () => {
            req.body = {
                reason: 'Spam',
                details: 'This note is spam',
                noteId: 'note_123'
            };

            (mockPrisma.report.create as any).mockResolvedValue({
                id: 'report_1',
                userId: 'user_123'
            });

            await reportController.create(req as any, res as Response);

            expect(mockPrisma.report.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user_123',
                    reason: 'Spam',
                    noteId: 'note_123'
                })
            });

            expect(statusMock).toHaveBeenCalledWith(201);
        });

        it('should create report for review', async () => {
            req.body = {
                reason: 'Offensive',
                details: 'Contains offensive language',
                reviewId: 'review_123'
            };

            (mockPrisma.report.create as any).mockResolvedValue({ id: 'report_1' });

            await reportController.create(req as any, res as Response);

            expect(mockPrisma.report.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    reviewId: 'review_123'
                })
            });
        });

        it('should return 400 if neither noteId nor reviewId provided', async () => {
            req.body = {
                reason: 'Test',
                details: 'Test'
            };

            await reportController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('note or review')
            }));
        });

        it('should return 500 on database error', async () => {
            req.body = { noteId: 'note_1', reason: 'Test', details: 'Test' };

            (mockPrisma.report.create as any).mockRejectedValue(new Error('DB Error'));

            await reportController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'CREATE_ERROR'
            }));
        });
    });

    describe('list', () => {
        it('should return paginated reports', async () => {
            req.query = { page: '1', limit: '10' };

            (mockPrisma.report.findMany as any).mockResolvedValue([
                {
                    id: 'report_1',
                    reason: 'Spam',
                    users: { full_name: 'John' },
                    notes: { title: 'Note Title' },
                    reviews: null
                }
            ]);
            (mockPrisma.report.count as any).mockResolvedValue(25);

            await reportController.list(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    pagination: expect.objectContaining({
                        total: 25,
                        totalPages: 3
                    })
                })
            }));
        });

        it('should filter by status', async () => {
            req.query = { status: 'PENDING' };

            (mockPrisma.report.findMany as any).mockResolvedValue([]);
            (mockPrisma.report.count as any).mockResolvedValue(0);

            await reportController.list(req as any, res as Response);

            expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'PENDING' }
                })
            );
        });

        it('should include user/note/review details', async () => {
            req.query = {};

            (mockPrisma.report.findMany as any).mockResolvedValue([]);
            (mockPrisma.report.count as any).mockResolvedValue(0);

            await reportController.list(req as any, res as Response);

            expect(mockPrisma.report.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        users: expect.any(Object),
                        notes: expect.any(Object),
                        reviews: expect.any(Object)
                    })
                })
            );
        });
    });

    describe('updateStatus', () => {
        it('should update report status', async () => {
            req.params = { id: 'report_1' };
            req.body = { status: 'RESOLVED' };

            (mockPrisma.report.update as any).mockResolvedValue({
                id: 'report_1',
                status: 'RESOLVED'
            });

            await reportController.updateStatus(req as any, res as Response);

            expect(mockPrisma.report.update).toHaveBeenCalledWith({
                where: { id: 'report_1' },
                data: { status: 'RESOLVED' }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });

        it('should return 500 on error', async () => {
            req.params = { id: 'report_1' };
            req.body = { status: 'RESOLVED' };

            (mockPrisma.report.update as any).mockRejectedValue(new Error('Update failed'));

            await reportController.updateStatus(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});

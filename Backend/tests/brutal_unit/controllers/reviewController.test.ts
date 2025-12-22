import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    reviews: {
        findMany: jest.fn() as any,
        findFirst: jest.fn() as any,
        create: jest.fn() as any,
    },
    purchases: {
        findFirst: jest.fn() as any,
    },
    notes: {
        update: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { reviewController } from '../../../src/controllers/reviewController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('ReviewController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, params?: any, body?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'user_123' } as any, params: {}, body: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('list', () => {
        it('should return approved reviews only', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.reviews.findMany as any).mockResolvedValue([
                {
                    id: 'review_1',
                    note_id: 'note_1',
                    user_id: 'user_1',
                    rating: 5,
                    comment: 'Great notes!',
                    is_verified_purchase: true,
                    is_approved: true,
                    created_at: new Date(),
                    users: { id: 'user_1', full_name: 'John Doe', profile_picture_url: 'https://img.jpg' }
                }
            ]);

            await reviewController.list(req as Request, res as Response);

            expect(mockPrisma.reviews.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        note_id: 'note_1',
                        is_approved: true
                    }
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        rating: 5,
                        comment: 'Great notes!',
                        isVerifiedPurchase: true
                    })
                ])
            }));
        });

        it('should include user information', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.reviews.findMany as any).mockResolvedValue([]);

            await reviewController.list(req as Request, res as Response);

            expect(mockPrisma.reviews.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: {
                        users: expect.objectContaining({
                            select: expect.objectContaining({ full_name: true })
                        })
                    }
                })
            );
        });

        it('should order by created_at desc', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.reviews.findMany as any).mockResolvedValue([]);

            await reviewController.list(req as Request, res as Response);

            expect(mockPrisma.reviews.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { created_at: 'desc' }
                })
            );
        });

        it('should return 500 on database error', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.reviews.findMany as any).mockRejectedValue(new Error('DB Error'));

            await reviewController.list(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('create', () => {
        it('should create review successfully with purchase', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: 5, title: 'Great', comment: 'Excellent notes!' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({
                id: 'purchase_1',
                user_id: 'user_123',
                note_id: 'note_1',
                transaction_id: 'txn_123',
                is_active: true
            });

            (mockPrisma.reviews.findFirst as any).mockResolvedValue(null); // No existing review

            (mockPrisma.reviews.create as any).mockResolvedValue({
                id: 'review_new',
                rating: 5
            });

            (mockPrisma.reviews.findMany as any).mockResolvedValue([
                { rating: 5 },
                { rating: 4 }
            ]);

            (mockPrisma.notes.update as any).mockResolvedValue({});

            await reviewController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(mockPrisma.reviews.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        note_id: 'note_1',
                        user_id: 'user_123',
                        transaction_id: 'txn_123',
                        rating: 5,
                        is_verified_purchase: true,
                        is_approved: true
                    })
                })
            );
        });

        it('should return 403 if user has not purchased note', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: 5, comment: 'Test' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue(null);

            await reviewController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('purchased')
            }));
        });

        it('should return 400 if user already reviewed', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: 5, comment: 'Test' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({ transaction_id: 'txn_1' });
            (mockPrisma.reviews.findFirst as any).mockResolvedValue({ id: 'existing_review' });

            await reviewController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('already reviewed')
            }));
        });

        it('should convert rating to integer', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: '4', comment: 'Good' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({ transaction_id: 'txn_1' });
            (mockPrisma.reviews.findFirst as any).mockResolvedValue(null);
            (mockPrisma.reviews.create as any).mockResolvedValue({ id: 'r1' });
            (mockPrisma.reviews.findMany as any).mockResolvedValue([{ rating: 4 }]);
            (mockPrisma.notes.update as any).mockResolvedValue({});

            await reviewController.create(req as any, res as Response);

            expect(mockPrisma.reviews.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ rating: 4 }) // Parsed to int
                })
            );
        });

        it('should update note average rating and count', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: 5, comment: 'Test' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({ transaction_id: 'txn_1' });
            (mockPrisma.reviews.findFirst as any).mockResolvedValue(null);
            (mockPrisma.reviews.create as any).mockResolvedValue({ id: 'r1' });

            (mockPrisma.reviews.findMany as any).mockResolvedValue([
                { rating: 5 },
                { rating: 4 },
                { rating: 3 }
            ]);

            (mockPrisma.notes.update as any).mockResolvedValue({});

            await reviewController.create(req as any, res as Response);

            expect(mockPrisma.notes.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'note_1' },
                    data: expect.objectContaining({
                        average_rating: 4, // (5+4+3)/3 = 4
                        total_reviews: 3
                    })
                })
            );
        });

        it('should only include approved reviews in average calculation', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: 5, comment: 'Test' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue({ transaction_id: 'txn_1' });
            (mockPrisma.reviews.findFirst as any).mockResolvedValue(null);
            (mockPrisma.reviews.create as any).mockResolvedValue({ id: 'r1' });
            (mockPrisma.reviews.findMany as any).mockResolvedValue([{ rating: 5 }]);
            (mockPrisma.notes.update as any).mockResolvedValue({});

            await reviewController.create(req as any, res as Response);

            expect(mockPrisma.reviews.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ is_approved: true })
                })
            );
        });

        it('should verify purchase is active', async () => {
            req.params = { noteId: 'note_1' };
            req.body = { rating: 5, comment: 'Test' };

            (mockPrisma.purchases.findFirst as any).mockResolvedValue(null);

            await reviewController.create(req as any, res as Response);

            expect(mockPrisma.purchases.findFirst).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ is_active: true })
                })
            );
        });
    });
});

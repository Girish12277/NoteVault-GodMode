import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    wishlist: {
        findUnique: jest.fn() as any,
        findMany: jest.fn() as any,
        create: jest.fn() as any,
        delete: jest.fn() as any,
        count: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { wishlistController } from '../../../src/controllers/wishlistController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('WishlistController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, params?: any, query?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'user_123' } as any, params: {}, query: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('toggle', () => {
        it('should add note to wishlist if not present', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.wishlist.findUnique as any).mockResolvedValue(null); // Not in wishlist
            (mockPrisma.wishlist.create as any).mockResolvedValue({
                id: 'wishlist_1',
                userId: 'user_123',
                noteId: 'note_1'
            });

            await wishlistController.toggle(req as any, res as Response);

            expect(mockPrisma.wishlist.create).toHaveBeenCalledWith({
                data: { userId: 'user_123', noteId: 'note_1' }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Added'),
                data: { isWishlisted: true }
            }));
        });

        it('should remove note from wishlist if present', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.wishlist.findUnique as any).mockResolvedValue({
                id: 'wishlist_1',
                userId: 'user_123',
                noteId: 'note_1'
            });

            (mockPrisma.wishlist.delete as any).mockResolvedValue({});

            await wishlistController.toggle(req as any, res as Response);

            expect(mockPrisma.wishlist.delete).toHaveBeenCalledWith({
                where: { id: 'wishlist_1' }
            });

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('Removed'),
                data: { isWishlisted: false }
            }));
        });

        it('should use compound unique key for lookup', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.wishlist.findUnique as any).mockResolvedValue(null);
            (mockPrisma.wishlist.create as any).mockResolvedValue({});

            await wishlistController.toggle(req as any, res as Response);

            expect(mockPrisma.wishlist.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_noteId: { userId: 'user_123', noteId: 'note_1' }
                }
            });
        });

        it('should return 500 on database error', async () => {
            req.params = { noteId: 'note_1' };

            (mockPrisma.wishlist.findUnique as any).mockRejectedValue(new Error('DB Error'));

            await wishlistController.toggle(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'UPDATE_ERROR'
            }));
        });
    });

    describe('list', () => {
        it('should return paginated wishlist with notes', async () => {
            req.query = { page: '2', limit: '10' };

            const mockItems = [
                {
                    id: 'wishlist_1',
                    userId: 'user_123',
                    noteId: 'note_1',
                    createdAt: new Date(),
                    notes: {
                        id: 'note_1',
                        title: 'Physics Notes',
                        users: { full_name: 'Seller 1' },
                        universities: { name: 'MIT' }
                    }
                }
            ];

            (mockPrisma.wishlist.findMany as any).mockResolvedValue(mockItems);
            (mockPrisma.wishlist.count as any).mockResolvedValue(25);

            await wishlistController.list(req as any, res as Response);

            expect(mockPrisma.wishlist.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'user_123' },
                    skip: 10, // (page 2 - 1) * limit 10
                    take: 10
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    items: expect.arrayContaining([expect.any(Object)]),
                    pagination: expect.objectContaining({
                        total: 25,
                        page: 2,
                        limit: 10,
                        totalPages: 3
                    })
                })
            }));
        });

        it('should use default pagination if not provided', async () => {
            req.query = {};

            (mockPrisma.wishlist.findMany as any).mockResolvedValue([]);
            (mockPrisma.wishlist.count as any).mockResolvedValue(0);

            await wishlistController.list(req as any, res as Response);

            expect(mockPrisma.wishlist.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 0, // Default page 1
                    take: 20 // Default limit
                })
            );
        });

        it('should order by createdAt desc', async () => {
            req.query = {};

            (mockPrisma.wishlist.findMany as any).mockResolvedValue([]);
            (mockPrisma.wishlist.count as any).mockResolvedValue(0);

            await wishlistController.list(req as any, res as Response);

            expect(mockPrisma.wishlist.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { createdAt: 'desc' }
                })
            );
        });

        it('should include note details with seller and university', async () => {
            req.query = {};

            (mockPrisma.wishlist.findMany as any).mockResolvedValue([]);
            (mockPrisma.wishlist.count as any).mockResolvedValue(0);

            await wishlistController.list(req as any, res as Response);

            expect(mockPrisma.wishlist.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: {
                        notes: expect.objectContaining({
                            include: expect.objectContaining({
                                users: expect.any(Object),
                                universities: expect.any(Object)
                            })
                        })
                    }
                })
            );
        });

        it('should return 500 on database error', async () => {
            req.query = {};

            (mockPrisma.wishlist.findMany as any).mockRejectedValue(new Error('Query failed'));

            await wishlistController.list(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });

        it('should filter by userId only', async () => {
            req.query = {};
            req.user!.id = 'different_user';

            (mockPrisma.wishlist.findMany as any).mockResolvedValue([]);
            (mockPrisma.wishlist.count as any).mockResolvedValue(0);

            await wishlistController.list(req as any, res as Response);

            expect(mockPrisma.wishlist.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'different_user' }
                })
            );
        });
    });
});

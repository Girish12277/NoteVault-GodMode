import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    categories: {
        findMany: jest.fn() as any,
        findUnique: jest.fn() as any,
        create: jest.fn() as any,
        update: jest.fn() as any,
        delete: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { categoryController } from '../../../src/controllers/categoryController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('CategoryController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { params?: any, body?: any, user?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { params: {}, body: {}, user: { isAdmin: true } as any };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('list', () => {
        it('should return all categories with note counts', async () => {
            (mockPrisma.categories.findMany as any).mockResolvedValue([
                { id: 'cat_1', name: 'Physics', name_hi: 'भौतिकी', slug: 'physics', icon: '⚛️', _count: { notes: 10 } },
                { id: 'cat_2', name: 'Math', name_hi: 'गणित', slug: 'math', icon: '🔢', _count: { notes: 5 } }
            ]);

            await categoryController.list(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({ name: 'Physics', count: 10 }),
                    expect.objectContaining({ name: 'Math', count: 5 })
                ])
            }));
        });

        it('should handle empty categories', async () => {
            (mockPrisma.categories.findMany as any).mockResolvedValue([]);

            await categoryController.list(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: []
            }));
        });

        it('should return 500 on database error', async () => {
            (mockPrisma.categories.findMany as any).mockRejectedValue(new Error('DB Error'));

            await categoryController.list(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                code: 'FETCH_ERROR'
            }));
        });
    });

    describe('getById', () => {
        it('should return category with notes', async () => {
            req.params = { id: 'cat_1' };
            (mockPrisma.categories.findUnique as any).mockResolvedValue({
                id: 'cat_1',
                name: 'Physics',
                name_hi: 'भौतिकी',
                slug: 'physics',
                icon: '⚛️',
                notes: [
                    { id: 'note_1', title: 'Test Note', seller: { id: 'seller_1', full_name: 'John' } }
                ],
                _count: { notes: 15 }
            });

            await categoryController.getById(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    name: 'Physics',
                    noteCount: 15,
                    notes: expect.arrayContaining([expect.any(Object)])
                })
            }));
        });

        it('should return 404 if category not found', async () => {
            req.params = { id: 'nonexistent' };
            (mockPrisma.categories.findUnique as any).mockResolvedValue(null);

            await categoryController.getById(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'NOT_FOUND'
            }));
        });
    });

    describe('create', () => {
        it('should create category successfully', async () => {
            req.body = {
                name: 'Chemistry',
                nameHi: 'रसायन विज्ञान',
                slug: 'chemistry',
                icon: '🧪'
            };

            (mockPrisma.categories.findUnique as any).mockResolvedValue(null); // No duplicate
            (mockPrisma.categories.create as any).mockResolvedValue({
                id: 'cat_new',
                ...req.body
            });

            await categoryController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(201);
            expect(mockPrisma.categories.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Chemistry',
                    slug: 'chemistry'
                })
            }));
        });

        it('should return 409 if slug already exists', async () => {
            req.body = { name: 'Test', slug: 'physics' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue({ id: 'existing', slug: 'physics' });

            await categoryController.create(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'DUPLICATE_SLUG'
            }));
        });

        it('should convert slug to lowercase', async () => {
            req.body = { name: 'Test', slug: 'UPPERCASE-SLUG' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue(null);
            (mockPrisma.categories.create as any).mockResolvedValue({ id: 'new' });

            await categoryController.create(req as any, res as Response);

            expect(mockPrisma.categories.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ slug: 'uppercase-slug' })
                })
            );
        });
    });

    describe('update', () => {
        it('should update category successfully', async () => {
            req.params = { id: 'cat_1' };
            req.body = { name: 'Updated Name', icon: '🔥' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue({ id: 'cat_1', slug: 'old-slug' });
            (mockPrisma.categories.update as any).mockResolvedValue({ id: 'cat_1', ...req.body });

            await categoryController.update(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('updated')
            }));
        });

        it('should return 404 if category not found', async () => {
            req.params = { id: 'nonexistent' };
            req.body = { name: 'Test' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue(null);

            await categoryController.update(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });

        it('should check for duplicate slug  when changing slug', async () => {
            req.params = { id: 'cat_1' };
            req.body = { slug: 'new-slug' };

            (mockPrisma.categories.findUnique as any)
                .mockResolvedValueOnce({ id: 'cat_1', slug: 'old-slug' }) // Existing category
                .mockResolvedValueOnce({ id: 'cat_2', slug: 'new-slug' }); // Duplicate

            await categoryController.update(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(409);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'DUPLICATE_SLUG'
            }));
        });

        it('should allow update if slug unchanged', async () => {
            req.params = { id: 'cat_1' };
            req.body = { name: 'New Name', slug: 'same-slug' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue({ id: 'cat_1', slug: 'same-slug' });
            (mockPrisma.categories.update as any).mockResolvedValue({ id: 'cat_1' });

            await categoryController.update(req as any, res as Response);

            expect(mockPrisma.categories.update).toHaveBeenCalled();
        });
    });

    describe('delete', () => {
        it('should delete empty category', async () => {
            req.params = { id: 'cat_empty' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue({
                id: 'cat_empty',
                _count: { notes: 0 }
            });

            (mockPrisma.categories.delete as any).mockResolvedValue({});

            await categoryController.delete(req as any, res as Response);

            expect(mockPrisma.categories.delete).toHaveBeenCalledWith({ where: { id: 'cat_empty' } });
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });

        it('should return 400 if category has notes', async () => {
            req.params = { id: 'cat_with_notes' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue({
                id: 'cat_with_notes',
                _count: { notes: 5 }
            });

            await categoryController.delete(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'HAS_NOTES',
                message: expect.stringContaining('5 notes')
            }));

            expect(mockPrisma.categories.delete).not.toHaveBeenCalled();
        });

        it('should return 404 if category not found', async () => {
            req.params = { id: 'nonexistent' };

            (mockPrisma.categories.findUnique as any).mockResolvedValue(null);

            await categoryController.delete(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });
});

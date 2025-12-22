import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockPrisma = {
    universities: {
        findMany: jest.fn() as any,
        findUnique: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Import Controller
import { universityController } from '../../../src/controllers/universityController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('UniversityController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { params?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { params: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('list', () => {
        it('should return active universities with counts', async () => {
            (mockPrisma.universities.findMany as any).mockResolvedValue([
                {
                    id: 'uni_1',
                    name: 'IIT Delhi',
                    short_name: 'IITD',
                    state: 'Delhi',
                    city: 'New Delhi',
                    type: 'PUBLIC',
                    courses_offered: ['BTech', 'MTech'],
                    _count: { notes: 50, users: 200 }
                },
                {
                    id: 'uni_2',
                    name: 'DU',
                    short_name: 'DU',
                    state: 'Delhi',
                    city: 'Delhi',
                    type: 'PUBLIC',
                    courses_offered: ['BA', 'BSc'],
                    _count: { notes: 30, users: 150 }
                }
            ]);

            await universityController.list(req as Request, res as Response);

            expect(mockPrisma.universities.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { is_active: true }
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'IIT Delhi',
                        noteCount: 50,
                        studentCount: 200
                    })
                ])
            }));
        });

        it('should handle empty result', async () => {
            (mockPrisma.universities.findMany as any).mockResolvedValue([]);

            await universityController.list(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: []
            }));
        });

        it('should return 500 on database error', async () => {
            (mockPrisma.universities.findMany as any).mockRejectedValue(new Error('DB Connection Failed'));

            await universityController.list(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('Failed')
            }));
        });
    });

    describe('getById', () => {
        it('should return university with recent notes', async () => {
            req.params = { id: 'uni_1' };

            (mockPrisma.universities.findUnique as any).mockResolvedValue({
                id: 'uni_1',
                name: 'IIT Delhi',
                short_name: 'IITD',
                state: 'Delhi',
                city: 'New Delhi',
                type: 'PUBLIC',
                courses_offered: ['BTech'],
                notes: [
                    {
                        id: 'note_1',
                        title: 'Physics Notes',
                        seller: { id: 'seller_1', full_name: 'John Doe' },
                        category: { name: 'Physics', name_hi: 'भौतिकी', icon: '⚛️' }
                    }
                ],
                _count: { notes: 50, users: 200 }
            });

            await universityController.getById(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    name: 'IIT Delhi',
                    noteCount: 50,
                    studentCount: 200,
                    recentNotes: expect.arrayContaining([expect.any(Object)])
                })
            }));
        });

        it('should return 404 if university not found', async () => {
            req.params = { id: 'nonexistent' };

            (mockPrisma.universities.findUnique as any).mockResolvedValue(null);

            await universityController.getById(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('not found')
            }));
        });

        it('should only include active, approved, non-deleted notes', async () => {
            req.params = { id: 'uni_1' };

            (mockPrisma.universities.findUnique as any).mockResolvedValue({
                id: 'uni_1',
                name: 'Test Uni',
                notes: [],
                _count: { notes: 0, users: 0 }
            });

            await universityController.getById(req as Request, res as Response);

            expect(mockPrisma.universities.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        notes: expect.objectContaining({
                            where: {
                                is_active: true,
                                is_approved: true,
                                is_deleted: false
                            }
                        })
                    })
                })
            );
        });

        it('should limit notes to 20', async () => {
            req.params = { id: 'uni_1' };

            (mockPrisma.universities.findUnique as any).mockResolvedValue({
                id: 'uni_1',
                name: 'Test',
                notes: [],
                _count: { notes: 0, users: 0 }
            });

            await universityController.getById(req as Request, res as Response);

            expect(mockPrisma.universities.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    include: expect.objectContaining({
                        notes: expect.objectContaining({ take: 20 })
                    })
                })
            );
        });

        it('should handle database error', async () => {
            req.params = { id: 'uni_1' };

            (mockPrisma.universities.findUnique as any).mockRejectedValue(new Error('Query timeout'));

            await universityController.getById(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});

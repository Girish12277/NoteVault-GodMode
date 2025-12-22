import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockCachedSearchService = {
    search: jest.fn() as any,
    autocomplete: jest.fn() as any,
    getFacets: jest.fn() as any,
};

jest.mock('../../../src/services/cachedSearchService', () => ({
    __esModule: true,
    cachedSearchService: mockCachedSearchService
}));

// Import Controller
import { searchController } from '../../../src/controllers/searchController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Search Controller - Brutal Unit Tests', () => {
    let req: Partial<Request> & { query?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = {
            query: {}
        };

        res = {
            status: statusMock as any,
            json: jsonMock as any,
        };
    });

    // ------------------------------------------------------------------
    // SEARCH ENDPOINT
    // ------------------------------------------------------------------
    describe('search', () => {
        it('should return 400 if query (q) is missing', async () => {
            req.query = {}; // No 'q' param

            await searchController.search(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: expect.stringContaining('required')
            }));
        });

        it('should return 400 if query is not a string', async () => {
            req.query = { q: ['array', 'attack'] }; // Type mismatch

            await searchController.search(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should handle SQL injection attempts safely', async () => {
            req.query = {
                q: "'; DROP TABLE notes; --",
                subject: "1' OR '1'='1"
            };

            mockCachedSearchService.search.mockResolvedValue([]);

            await searchController.search(req as Request, res as Response);

            // Service should be called (delegating to safe Prisma queries)
            expect(mockCachedSearchService.search).toHaveBeenCalledWith(
                "'; DROP TABLE notes; --",
                expect.any(Object)
            );
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should accept valid sort values', async () => {
            req.query = { q: 'physics', sort: 'popularity' };

            mockCachedSearchService.search.mockResolvedValue([
                { id: 'note_1', title: 'Physics 101' }
            ]);

            await searchController.search(req as Request, res as Response);

            expect(mockCachedSearchService.search).toHaveBeenCalledWith(
                'physics',
                expect.objectContaining({ sort: 'popularity' })
            );
        });

        it('should default to "relevance" for invalid sort value', async () => {
            req.query = { q: 'math', sort: 'INVALID_SORT' };

            mockCachedSearchService.search.mockResolvedValue([]);

            await searchController.search(req as Request, res as Response);

            expect(mockCachedSearchService.search).toHaveBeenCalledWith(
                'math',
                expect.objectContaining({ sort: 'relevance' })
            );
        });

        it('should handle empty search results gracefully', async () => {
            req.query = { q: 'nonexistent_topic' };

            mockCachedSearchService.search.mockResolvedValue([]);

            await searchController.search(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: [],
                count: 0
            }));
        });

        it('should apply filters correctly', async () => {
            req.query = {
                q: 'engineering',
                subject: 'Computer Science',
                university: 'MIT',
                minPrice: '100',
                maxPrice: '500',
                semester: '5'
            };

            mockCachedSearchService.search.mockResolvedValue([]);

            await searchController.search(req as Request, res as Response);

            expect(mockCachedSearchService.search).toHaveBeenCalledWith(
                'engineering',
                expect.objectContaining({
                    filters: expect.objectContaining({
                        subject: 'Computer Science',
                        university: 'MIT',
                        minPrice: 100,
                        maxPrice: 500,
                        semester: 5
                    })
                })
            );
        });

        it('should handle pagination (limit and offset)', async () => {
            req.query = { q: 'test', limit: '10', offset: '20' };

            mockCachedSearchService.search.mockResolvedValue([]);

            await searchController.search(req as Request, res as Response);

            expect(mockCachedSearchService.search).toHaveBeenCalledWith(
                'test',
                expect.objectContaining({
                    limit: 10,
                    offset: 20
                })
            );
        });

        it('should use default pagination if not provided', async () => {
            req.query = { q: 'default' };

            mockCachedSearchService.search.mockResolvedValue([]);

            await searchController.search(req as Request, res as Response);

            expect(mockCachedSearchService.search).toHaveBeenCalledWith(
                'default',
                expect.objectContaining({
                    limit: 20,
                    offset: 0
                })
            );
        });

        it('should handle service errors (500)', async () => {
            req.query = { q: 'error_case' };

            mockCachedSearchService.search.mockRejectedValue(new Error('Database connection failed'));

            await searchController.search(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Search failed'
            }));
        });
    });

    // ------------------------------------------------------------------
    // AUTOCOMPLETE ENDPOINT
    // ------------------------------------------------------------------
    describe('autocomplete', () => {
        it('should return empty array if query is missing', async () => {
            req.query = {};

            await searchController.autocomplete(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: []
            }));
        });

        it('should return empty array if query is less than 3 characters', async () => {
            req.query = { q: 'ab' }; // Only 2 chars

            await searchController.autocomplete(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: []
            }));
            expect(mockCachedSearchService.autocomplete).not.toHaveBeenCalled();
        });

        it('should fetch suggestions for valid query (>= 3 chars)', async () => {
            req.query = { q: 'phy' };

            mockCachedSearchService.autocomplete.mockResolvedValue([
                'Physics 101',
                'Physical Chemistry',
                'Physiology'
            ]);

            await searchController.autocomplete(req as Request, res as Response);

            expect(mockCachedSearchService.autocomplete).toHaveBeenCalledWith('phy');
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.arrayContaining(['Physics 101'])
            }));
        });

        it('should handle autocomplete service errors', async () => {
            req.query = { q: 'test' };

            mockCachedSearchService.autocomplete.mockRejectedValue(new Error('Cache miss'));

            await searchController.autocomplete(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    // ------------------------------------------------------------------
    // FACETS ENDPOINT
    // ------------------------------------------------------------------
    describe('facets', () => {
        it('should fetch facets successfully', async () => {
            mockCachedSearchService.getFacets.mockResolvedValue({
                subjects: ['Physics', 'Math'],
                universities: ['MIT', 'Stanford'],
                semesters: [1, 2, 3, 4, 5, 6, 7, 8]
            });

            await searchController.facets(req as Request, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    subjects: expect.any(Array)
                })
            }));
        });

        it('should handle facets service errors', async () => {
            mockCachedSearchService.getFacets.mockRejectedValue(new Error('DB Error'));

            await searchController.facets(req as Request, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'Facets retrieval failed'
            }));
        });
    });
});

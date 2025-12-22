// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS
// ------------------------------------------------------------------

// Mock Cache Service
jest.mock('../../../src/services/cacheService', () => ({
    cacheService: {
        get: jest.fn(),
        set: jest.fn()
    }
}));

// Mock Gorse Service
jest.mock('../../../src/services/gorseRecommendationService', () => ({
    gorseService: {
        getRecommendationsForUser: jest.fn(),
        getSimilarNotes: jest.fn(),
        getPopularNotes: jest.fn(),
        getLatestNotes: jest.fn()
    }
}));

// Mock Prisma
const mockPrisma = {
    notes: {
        findMany: jest.fn(),
        findUnique: jest.fn()
    }
};

jest.mock('../../../src/config/database', () => ({
    prisma: mockPrisma
}));

// ------------------------------------------------------------------
// IMPORTS
// ------------------------------------------------------------------
import { recommendationController } from '../../../src/controllers/recommendationController';
import { cacheService } from '../../../src/services/cacheService';
import { gorseService } from '../../../src/services/gorseRecommendationService';

// Type mocks
const mockCacheService = cacheService as any;
const mockGorseService = gorseService as any;

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Recommendation Controller - Brutal Unit Tests', () => {
    let req: any;
    let res: any;

    const mockNote = {
        id: 'note-1',
        title: 'Calc 101',
        description: 'Calculus',
        subject: 'Math',
        degree: 'BS',
        semester: 1,
        price_inr: 50,
        total_pages: 10,
        average_rating: 4.5,
        total_reviews: 2,
        cover_image: 'cover.jpg',
        seller_id: 'seller-1',
        created_at: new Date(),
        users: {
            id: 'seller-1',
            full_name: 'John Doe',
            profile_picture_url: 'pic.jpg'
        },
        universities: {
            name: 'Harvard',
            short_name: 'HU'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            user: { id: 'user-123' },
            body: {},
            params: {},
            query: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    describe('getPersonalized', () => {
        it('should return cached data if available', async () => {
            mockCacheService.get.mockResolvedValue(['cached-note']);
            await recommendationController.getPersonalized(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                cached: true,
                data: ['cached-note']
            }));
            expect(mockGorseService.getRecommendationsForUser).not.toHaveBeenCalled();
        });

        it('should fetch from Gorse and DB on cache miss', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getRecommendationsForUser.mockResolvedValue(['note-1']);
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]);

            await recommendationController.getPersonalized(req, res);

            expect(mockGorseService.getRecommendationsForUser).toHaveBeenCalledWith('user-123', 20);
            expect(mockPrisma.notes.findMany).toHaveBeenCalledTimes(1);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                count: 1
            }));
            expect(mockCacheService.set).toHaveBeenCalled();
        });

        it('should fallback to popular if Gorse returns empty', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getRecommendationsForUser.mockResolvedValue([]);
            mockGorseService.getPopularNotes.mockResolvedValue(['note-1']); // Fallback calls popular
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]);

            await recommendationController.getPersonalized(req, res);

            expect(mockGorseService.getPopularNotes).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                fallback: true,
                message: expect.stringContaining('popular')
            }));
        });

        it('should handle errors gracefully', async () => {
            mockCacheService.get.mockRejectedValue(new Error('Redis Fail'));
            await recommendationController.getPersonalized(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getSimilar', () => {
        beforeEach(() => {
            req.params.noteId = 'note-1';
        });

        it('should return cached data', async () => {
            mockCacheService.get.mockResolvedValue(['cached-similar']);
            await recommendationController.getSimilar(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cached: true }));
        });

        it('should fetch from Gorse and DB', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getSimilarNotes.mockResolvedValue(['note-2']);
            mockPrisma.notes.findMany.mockResolvedValue([{ ...mockNote, id: 'note-2' }]);

            await recommendationController.getSimilar(req, res);

            expect(mockGorseService.getSimilarNotes).toHaveBeenCalledWith('note-1', 10);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, count: 1 }));
        });

        it('should fallback to DB same subject if Gorse empty', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getSimilarNotes.mockResolvedValue([]); // Empty Gorse

            // Mock source note lookup
            mockPrisma.notes.findUnique.mockResolvedValue({ subject: 'Math', degree: 'BS' });
            // Mock fallback lookup
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]);

            await recommendationController.getSimilar(req, res);

            expect(mockPrisma.notes.findUnique).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                fallback: true,
                message: expect.stringContaining('same subject')
            }));
        });

        it('should return empty if source note not found for fallback', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getSimilarNotes.mockResolvedValue([]);
            mockPrisma.notes.findUnique.mockResolvedValue(null);

            await recommendationController.getSimilar(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                data: [],
                message: 'No similar notes found'
            }));
        });
    });

    describe('getPopular', () => {
        it('should return cached data', async () => {
            mockCacheService.get.mockResolvedValue(['cached-pop']);
            await recommendationController.getPopular(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cached: true }));
        });

        it('should fetch from Gorse', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getPopularNotes.mockResolvedValue(['note-1']);
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]);

            await recommendationController.getPopular(req, res);

            expect(mockGorseService.getPopularNotes).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should fallback to DB if Gorse empty', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getPopularNotes.mockResolvedValue([]);
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]); // DB Fallback

            await recommendationController.getPopular(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                fallback: true
            }));
            // findMany called for fallback with orderBy
            expect(mockPrisma.notes.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: expect.arrayContaining([{ purchase_count: 'desc' }])
            }));
        });
    });

    describe('getLatest', () => {
        it('should return cached data', async () => {
            mockCacheService.get.mockResolvedValue(['cached-latest']);
            await recommendationController.getLatest(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cached: true }));
        });

        it('should fetch from Gorse', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getLatestNotes.mockResolvedValue(['note-1']);
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]);

            await recommendationController.getLatest(req, res);

            expect(mockGorseService.getLatestNotes).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should fallback to DB if Gorse empty', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockGorseService.getLatestNotes.mockResolvedValue([]);
            mockPrisma.notes.findMany.mockResolvedValue([mockNote]);

            await recommendationController.getLatest(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                fallback: true
            }));
            expect(mockPrisma.notes.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: { created_at: 'desc' }
            }));
        });
    });

});

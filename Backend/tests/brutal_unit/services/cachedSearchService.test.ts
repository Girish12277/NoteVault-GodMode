// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
};
jest.mock('../../../src/services/cacheService', () => ({
    cacheService: mockCacheService
}));

const mockPostgresSearchService = {
    smartSearch: jest.fn(),
    autocomplete: jest.fn(),
    getFacets: jest.fn()
};
jest.mock('../../../src/services/postgresSearchService', () => ({
    postgresSearchService: mockPostgresSearchService
}));

import { cachedSearchService } from '../../../src/services/cachedSearchService';

describe('CachedSearchService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('search', () => {
        it('should return cached result', async () => {
            mockCacheService.get.mockResolvedValue(JSON.stringify(['result']));

            const result = await cachedSearchService.search('query');

            expect(result).toEqual(['result']);
            expect(mockPostgresSearchService.smartSearch).not.toHaveBeenCalled();
        });

        it('should fetch and cache if not in cache', async () => {
            mockCacheService.get.mockResolvedValue(null);
            mockPostgresSearchService.smartSearch.mockResolvedValue(['res']);

            const result = await cachedSearchService.search('query');

            expect(result).toEqual(['res']);
            expect(mockPostgresSearchService.smartSearch).toHaveBeenCalled();
            expect(mockCacheService.set).toHaveBeenCalled();
        });
    });

    describe('autocomplete', () => {
        it('should use cache', async () => {
            mockCacheService.get.mockResolvedValue(JSON.stringify(['auto']));
            const res = await cachedSearchService.autocomplete('q');
            expect(res).toEqual(['auto']);
        });
    });

    describe('getFacets', () => {
        it('should use cache', async () => {
            mockCacheService.get.mockResolvedValue(JSON.stringify({ facet: 1 }));
            const res = await cachedSearchService.getFacets();
            expect(res).toEqual({ facet: 1 });
        });
    });

    describe('invalidateCache', () => {
        it('should del cache', async () => {
            await cachedSearchService.invalidateCache();
            expect(mockCacheService.del).toHaveBeenCalled();
        });
    });
});

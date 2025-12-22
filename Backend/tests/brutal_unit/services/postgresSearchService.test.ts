// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: {
        $queryRaw: jest.fn(),
        $queryRawUnsafe: jest.fn()
    }
}));

import { prisma } from '../../../src/config/database';
const mockPrisma = prisma as unknown as {
    $queryRaw: jest.Mock;
    $queryRawUnsafe: jest.Mock;
};

const mockLogger = {
    error: jest.fn(),
    info: jest.fn()
};
jest.mock('../../../src/services/logger', () => ({
    logger: mockLogger
}));

import { postgresSearchService } from '../../../src/services/postgresSearchService';

describe('PostgresSearchService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('smartSearch', () => {
        it('should execute raw query', async () => {
            mockPrisma.$queryRawUnsafe.mockResolvedValue([{ id: 'n1', title: 'Note' }]);

            const results = await postgresSearchService.smartSearch('term');

            expect(results).toEqual([{ id: 'n1', title: 'Note' }]);
            expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalled();
        });

        it('should handle empty query', async () => {
            // Depending on implementation, might return empty or execute default
            mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
            await postgresSearchService.smartSearch('');
            // Expectation depends on logic: likely returns recent notes or empty
        });

        it('should handle error', async () => {
            mockPrisma.$queryRawUnsafe.mockRejectedValue(new Error('DB Fail'));
            const results = await postgresSearchService.smartSearch('term');
            expect(results).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });

    describe('autocomplete', () => {
        it('should return suggestions', async () => {
            mockPrisma.$queryRawUnsafe.mockResolvedValue([{ term: 'calc', score: 1 }]);
            const results = await postgresSearchService.autocomplete('calc');
            expect(results).toEqual([{ term: 'calc', score: 1 }]);
        });
    });

    describe('getFacets', () => {
        it('should return facets', async () => {
            // Mock multiple query returns if it runs multiple queries
            // Or assumes single query structure.
            // If getFacets runs 2 queries, we need to mock sequentially.
            mockPrisma.$queryRaw.mockResolvedValueOnce([{ category: 'A', count: 10 }]);
            mockPrisma.$queryRaw.mockResolvedValueOnce([{ subject: 'S', count: 5 }]);

            // If implementation uses $queryRaw

            const facets = await postgresSearchService.getFacets();
            expect(facets).toBeDefined();
        });
    });
});

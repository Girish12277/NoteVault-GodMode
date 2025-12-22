// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import axios from 'axios';

const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
};

jest.mock('axios', () => ({
    create: jest.fn(() => mockAxiosInstance)
}));

import { gorseService } from '../../../src/services/gorseRecommendationService';

describe('GorseRecommendationService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('trackInteraction', () => {
        it('should send feedback to Gorse', async () => {
            mockAxiosInstance.post.mockResolvedValue({});

            const result = await gorseService.trackInteraction('u1', 'n1', 'view');

            expect(result).toBe(true);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/feedback', expect.any(Array));
        });

        it('should handle failure', async () => {
            mockAxiosInstance.post.mockRejectedValue(new Error('Fail'));

            const result = await gorseService.trackInteraction('u1', 'n1', 'view');

            expect(result).toBe(false);
        });
    });

    describe('getRecommendationsForUser', () => {
        it('should return item IDs', async () => {
            mockAxiosInstance.get.mockResolvedValue({
                data: [{ ItemId: 'n1', Score: 0.9 }]
            });

            const items = await gorseService.getRecommendationsForUser('u1');

            expect(items).toEqual(['n1']);
        });
    });

    describe('upsertNote', () => {
        it('should patch note', async () => {
            mockAxiosInstance.patch.mockResolvedValue({});
            const result = await gorseService.upsertNote('n1', ['cat1'], ['lbl1']);
            expect(result).toBe(true);
            expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/api/item/n1', expect.anything());
        });
    });

    describe('deleteNote', () => {
        it('should delete note', async () => {
            mockAxiosInstance.delete.mockResolvedValue({});
            const result = await gorseService.deleteNote('n1');
            expect(result).toBe(true);
        });
    });
});

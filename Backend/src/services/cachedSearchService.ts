/**
 * Cached Search Service
 * Wraps PostgresSearchService with Redis caching
 */

import { postgresSearchService } from './postgresSearchService';
import { cacheService } from './cacheService';

interface SearchOptions {
    limit?: number;
    offset?: number;
    filters?: any;
    sort?: 'relevance' | 'popularity' | 'recent' | 'price_low' | 'price_high';
}

export class CachedSearchService {

    /**
     * Search with caching (5 min TTL)
     */
    async search(query: string, options: SearchOptions = {}) {
        const cacheKey = `search:${query}:${JSON.stringify(options)}`;

        try {
            // Check cache first
            const cached = await cacheService.get(cacheKey) as string | null;
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.warn('Cache read error:', error);
        }

        // Execute search
        const results = await postgresSearchService.smartSearch(query, options as any);

        try {
            // Cache for 5 minutes (300 seconds)
            await cacheService.set(cacheKey, JSON.stringify(results), 300);
        } catch (error) {
            console.warn('Cache write error:', error);
        }

        return results;
    }

    /**
     * Autocomplete with caching (10 min TTL)
     */
    async autocomplete(query: string) {
        const cacheKey = `autocomplete:${query.toLowerCase()}`;

        try {
            const cached = await cacheService.get(cacheKey) as string | null;
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.warn('Cache read error:', error);
        }

        const results = await postgresSearchService.autocomplete(query);

        try {
            // Cache for 10 minutes (600 seconds)
            await cacheService.set(cacheKey, JSON.stringify(results), 600);
        } catch (error) {
            console.warn('Cache write error:', error);
        }

        return results;
    }

    /**
     * Get facets with caching (1 hour TTL)
     */
    async getFacets() {
        const cacheKey = 'search:facets';

        try {
            const cached = await cacheService.get(cacheKey) as string | null;
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (error) {
            console.warn('Cache read error:', error);
        }

        const results = await postgresSearchService.getFacets();

        try {
            // Cache for 1 hour (3600 seconds)
            await cacheService.set(cacheKey, JSON.stringify(results), 3600);
        } catch (error) {
            console.warn('Cache write error:', error);
        }

        return results;
    }

    /**
     * Invalidate search cache (call after note create/update/delete)
     */
    async invalidateCache() {
        try {
            // In production, use Redis SCAN to find and delete all search:* keys
            // For now, just clear facets
            await cacheService.del('search:facets');
        } catch (error) {
            console.warn('Cache invalidation error:', error);
        }
    }
}

export const cachedSearchService = new CachedSearchService();

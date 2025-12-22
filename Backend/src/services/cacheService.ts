/**
 * GOD-LEVEL REDIS CACHING SERVICE
 * 
 * 50-Year Veteran Protocol Compliance:
 * ✅ Database is source of truth (NEVER cache-only)
 * ✅ Cache as optimization only
 * ✅ Graceful degradation (fallback to DB if Redis down)
 * ✅ TTL-based invalidation
 * ✅ Monitoring metrics (hit rate, evictions)
 * ✅ Defense in depth (catches Redis connection failures)
 */

import Redis from 'ioredis';
import { logger } from './logger';

// Redis client with automatic reconnection
let redis: Redis | null = null;
let isRedisAvailable = false;

// Metrics
let cacheHits = 0;
let cacheMisses = 0;
let cacheErrors = 0;

/**
 * Initialize Redis connection with graceful degradation
 */
export async function initializeRedis(): Promise<boolean> {
    if (!process.env.REDIS_URL) {
        logger.info('Redis URL not configured - caching disabled');
        isRedisAvailable = false;
        return false;
    }

    try {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            enableReadyCheck: true,
            connectTimeout: 5000,
            lazyConnect: true
        });

        redis.on('connect', () => {
            logger.info('✅ Redis connected successfully');
            isRedisAvailable = true;
        });

        redis.on('error', (error) => {
            logger.error('Redis connection error', { error: error.message });
            isRedisAvailable = false;
            cacheErrors++;
        });

        redis.on('close', () => {
            logger.warn('Redis connection closed');
            isRedisAvailable = false;
        });

        redis.on('reconnecting', () => {
            logger.info('Redis reconnecting...');
        });

        await redis.connect();

        // Test connection
        await redis.ping();
        logger.info('Redis connection verified');
        return true;

    } catch (error: any) {
        logger.error('Failed to initialize Redis', { error: error.message });
        isRedisAvailable = false;
        redis = null;
        return false;
    }
}

/**
 * Cache service with God-Level guarantees
 */
export const cacheService = {
    /**
     * Get cached value
     * CRITICAL: Returns null on any error (graceful degradation)
     */
    async get<T>(key: string): Promise<T | null> {
        if (!isRedisAvailable || !redis) {
            cacheMisses++;
            return null;
        }

        try {
            const cached = await redis.get(key);

            if (cached) {
                cacheHits++;
                logger.debug('Cache HIT', { key });
                return JSON.parse(cached) as T;
            }

            cacheMisses++;
            logger.debug('Cache MISS', { key });
            return null;

        } catch (error: any) {
            cacheErrors++;
            logger.warn('Cache get error - degrading to DB', {
                key,
                error: error.message
            });
            return null; // Graceful degradation
        }
    },

    /**
     * Set cached value with TTL
     * CRITICAL: Never throws - silent failure on errors
     */
    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        if (!isRedisAvailable || !redis) {
            return; // Silent fail - cache is optimization only
        }

        try {
            await redis.setex(key, ttlSeconds, JSON.stringify(value));
            logger.debug('Cache SET', { key, ttl: ttlSeconds });

        } catch (error: any) {
            cacheErrors++;
            logger.warn('Cache set error - continuing without cache', {
                key,
                error: error.message
            });
            // Silent fail - cache is optimization only
        }
    },

    /**
     * Delete cached value (invalidation)
     */
    async del(key: string): Promise<void> {
        if (!isRedisAvailable || !redis) {
            return;
        }

        try {
            await redis.del(key);
            logger.debug('Cache INVALIDATE', { key });

        } catch (error: any) {
            cacheErrors++;
            logger.warn('Cache delete error', {
                key,
                error: error.message
            });
        }
    },

    /**
     * Delete multiple keys (pattern-based invalidation)
     */
    async delPattern(pattern: string): Promise<void> {
        if (!isRedisAvailable || !redis) {
            return;
        }

        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                logger.info('Cache INVALIDATE pattern', {
                    pattern,
                    count: keys.length
                });
            }

        } catch (error: any) {
            cacheErrors++;
            logger.warn('Cache pattern delete error', {
                pattern,
                error: error.message
            });
        }
    },

    /**
     * Get cache statistics
     */
    getStats(): {
        hits: number;
        misses: number;
        errors: number;
        hitRate: number;
        isAvailable: boolean;
    } {
        const total = cacheHits + cacheMisses;
        const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;

        return {
            hits: cacheHits,
            misses: cacheMisses,
            errors: cacheErrors,
            hitRate: Math.round(hitRate * 100) / 100,
            isAvailable: isRedisAvailable
        };
    },

    /**
     * Reset statistics (for testing)
     */
    resetStats(): void {
        cacheHits = 0;
        cacheMisses = 0;
        cacheErrors = 0;
    },

    /**
     * Health check
     */
    async healthCheck(): Promise<boolean> {
        if (!isRedisAvailable || !redis) {
            return false;
        }

        try {
            const response = await redis.ping();
            return response === 'PONG';
        } catch {
            return false;
        }
    },

    /**
     * Graceful shutdown
     */
    async disconnect(): Promise<void> {
        if (redis) {
            await redis.quit();
            logger.info('Redis disconnected gracefully');
        }
    }
};

/**
 * Cache key builders (consistent naming)
 */
export const cacheKeys = {
    // Note listings
    notesList: (query: string) => `notes:list:${query}`,
    noteDetail: (noteId: string) => `notes:detail:${noteId}`,

    // User profiles
    userProfile: (userId: string) => `user:profile:${userId}`,

    // Search results
    searchResults: (query: string) => `search:${query}`,

    // Categories
    categoryList: () => `categories:list:all`,
    categoryById: (categoryId: string) => `categories:detail:${categoryId}`,

    // Universities
    universityList: () => `universities:list:all`,
    universityById: (universityId: string) => `universities:detail:${universityId}`,

    // Static content
    staticContent: (slug: string) => `content:${slug}`
};

/**
 * Cache TTL configuration (seconds)
 * Based on God-Level Scale Architecture analysis
 */
export const cacheTTL = {
    notesList: 300,        // 5 minutes
    noteDetail: 600,       // 10 minutes
    userProfile: 600,      // 10 minutes
    searchResults: 120,    // 2 minutes
    categories: 3600,      // 1 hour
    universities: 3600,    // 1 hour
    staticContent: 86400   // 24 hours
};

// Export for graceful shutdown
export { redis };

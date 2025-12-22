import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { cachedSearchService } from '../services/cachedSearchService';

export const searchController = {
    async search(req: Request, res: Response) {
        try {
            const { q, subject, university, minPrice, maxPrice, semester, sort, limit, offset } = req.query;

            if (!q || typeof q !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query (q) is required'
                });
            }

            // Use cached search service
            const sortValue = (sort as string) || 'relevance';
            const validSorts = ['relevance', 'popularity', 'recent', 'price_low', 'price_high'];
            const finalSort = validSorts.includes(sortValue) ? sortValue as any : 'relevance';

            const results = await cachedSearchService.search(q, {
                filters: {
                    subject: subject as string,
                    university: university as string,
                    minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
                    maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
                    semester: semester ? parseInt(semester as string) : undefined
                },
                sort: finalSort,
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0
            });

            res.json({
                success: true,
                data: results,
                count: results.length
            });
        } catch (error: any) {
            console.error('Search error:', error);
            res.status(500).json({
                success: false,
                message: 'Search failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    async autocomplete(req: Request, res: Response) {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                return res.json({ success: true, data: [] });
            }

            if (q.length < 3) {
                return res.json({ success: true, data: [] });
            }

            const suggestions = await cachedSearchService.autocomplete(q);

            res.json({
                success: true,
                data: suggestions
            });
        } catch (error: any) {
            console.error('Autocomplete error:', error);
            res.status(500).json({
                success: false,
                message: 'Autocomplete failed'
            });
        }
    },

    async facets(req: Request, res: Response) {
        try {
            const facets = await cachedSearchService.getFacets();

            res.json({
                success: true,
                data: facets
            });
        } catch (error: any) {
            console.error('Facets error:', error);
            res.status(500).json({
                success: false,
                message: 'Facets retrieval failed'
            });
        }
    }
};

/**
 * PostgreSQL Full-Text Search Service
 * God-Level search using native PostgreSQL features
 */

import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

interface SearchOptions {
    limit?: number;
    offset?: number;
    filters?: {
        subject?: string;
        university?: string;
        minPrice?: number;
        maxPrice?: number;
        semester?: number;
    };
    sort?: 'relevance' | 'popularity' | 'recent' | 'price_low' | 'price_high';
}

export class PostgresSearchService {

    /**
     * Full-text search with relevance ranking
     */
    async search(query: string, options: SearchOptions = {}) {
        const {
            limit = 20,
            offset = 0,
            filters = {},
            sort = 'relevance'
        } = options;

        if (!query || query.trim().length === 0) {
            return [];
        }

        // Sanitize query for ts_query (replace spaces with &)
        const tsQuery = query
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 0)
            .join(' & ');

        // Build filter conditions
        const filterConditions = this.buildFilterSQL(filters);

        // Build sort clause
        const sortClause = this.buildSortSQL(sort);

        try {
            const results = await prisma.$queryRawUnsafe(`
        SELECT 
          id,
          title,
          description,
          price,
          "coverImage",
          "downloadCount",
          rating,
          subject,
          university,
          semester,
          ts_rank(search_vector, to_tsquery('english', $1)) as rank
        FROM notes
        WHERE 
          search_vector @@ to_tsquery('english', $1)
          ${filterConditions}
        ORDER BY ${sortClause}
        LIMIT $2
        OFFSET $3
      `, tsQuery, limit, offset);

            return results;
        } catch (error: any) {
            logger.error('Full-text search error:', error);
            // Fallback to fuzzy search
            return this.fuzzySearch(query, 0.3, limit);
        }
    }

    /**
     * Typo-tolerant search using trigram similarity
     */
    async fuzzySearch(query: string, threshold = 0.3, limit = 20) {
        try {
            const results = await prisma.$queryRawUnsafe(`
        SELECT 
          id,
          title,
          description,
          price,
          "coverImage",
          "downloadCount",
          rating,
          subject,
          university,
          similarity(title, $1) as title_similarity,
          similarity(description, $1) as desc_similarity
        FROM notes
        WHERE 
          similarity(title, $1) > $2 OR
          similarity(description, $1) > $2
        ORDER BY 
          GREATEST(similarity(title, $1), similarity(description, $1)) DESC
        LIMIT $3
      `, query, threshold, limit);

            return results;
        } catch (error: any) {
            console.error('Fuzzy search error:', error);
            return [];
        }
    }

    /**
     * Autocomplete suggestions (prefix matching)
     */
    async autocomplete(query: string, limit = 10) {
        if (!query || query.length < 3) {
            return [];
        }

        try {
            const results = await prisma.$queryRawUnsafe(`
        SELECT DISTINCT title, "downloadCount"
        FROM notes
        WHERE 
          title ILIKE $1
        ORDER BY "downloadCount" DESC
        LIMIT $2
      `, `${query}%`, limit);

            return results;
        } catch (error: any) {
            console.error('Autocomplete error:', error);
            return [];
        }
    }

    /**
     * Combined smart search: Full-text + Fuzzy fallback
     */
    async smartSearch(query: string, options: SearchOptions = {}) {
        // Try full-text search first
        const ftResults = await this.search(query, options) as any[];

        // If few results, try fuzzy search as fallback
        if (ftResults.length < 5) {
            const fuzzyResults = await this.fuzzySearch(query, 0.3, 20) as any[];
            return this.mergeResults(ftResults, fuzzyResults);
        }

        return ftResults;
    }

    /**
   * Get search facets (for filters)
   */
    async getFacets() {
        try {
            const subjects = await prisma.notes.groupBy({
                by: ['subject'],
                _count: true,
                orderBy: { _count: { subject: 'desc' } }
            });

            // Get unique universities through a raw query since university_id is a relation
            const universities = await prisma.$queryRaw`
        SELECT DISTINCT u.name as university, COUNT(*)::int as count
        FROM notes n
        JOIN universities u ON n.university_id = u.id
        WHERE n.is_active = true AND n.is_approved = true
        GROUP BY u.name
        ORDER BY count DESC
      ` as any[];

            return {
                subjects: subjects.map((s: any) => ({ value: s.subject, count: s._count })),
                universities: universities.map((u: any) => ({ value: u.university, count: Number(u.count) }))
            };
        } catch (error: any) {
            console.error('Facets error:', error);
            return { subjects: [], universities: [] };
        }
    }

    // Helper: Build filter SQL
    private buildFilterSQL(filters: any): string {
        const conditions: string[] = [];

        if (filters.subject) {
            conditions.push(`AND subject = '${filters.subject}'`);
        }
        if (filters.university) {
            conditions.push(`AND university = '${filters.university}'`);
        }
        if (filters.minPrice !== undefined) {
            conditions.push(`AND price >= ${filters.minPrice}`);
        }
        if (filters.maxPrice !== undefined) {
            conditions.push(`AND price <= ${filters.maxPrice}`);
        }
        if (filters.semester) {
            conditions.push(`AND semester = ${filters.semester}`);
        }

        return conditions.join(' ');
    }

    // Helper: Build sort SQL
    private buildSortSQL(sort: string): string {
        switch (sort) {
            case 'popularity':
                return '"downloadCount" DESC, rank DESC';
            case 'recent':
                return '"createdAt" DESC';
            case 'price_low':
                return 'price ASC';
            case 'price_high':
                return 'price DESC';
            case 'relevance':
            default:
                return 'rank DESC, "downloadCount" DESC';
        }
    }

    // Helper: Merge and deduplicate results
    private mergeResults(ft: any[], fuzzy: any[]) {
        const seen = new Set(ft.map(r => r.id));
        const merged = [...ft];

        fuzzy.forEach(r => {
            if (!seen.has(r.id) && merged.length < 20) {
                merged.push(r);
            }
        });

        return merged;
    }
}

export const postgresSearchService = new PostgresSearchService();

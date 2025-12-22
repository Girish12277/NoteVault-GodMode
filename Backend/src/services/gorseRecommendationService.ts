/**
 * GORSE RECOMMENDATION ENGINE SERVICE
 * 
 * Integrates with Gorse (open-source collaborative filtering engine)
 * FREE: Apache 2.0 license, self-hosted
 * 
 * Capabilities:
 * - User-based collaborative filtering
 * - Item-based collaborative filtering
 * - Real-time recommendation updates
 * - Multi-source feedback (views, purchases, clicks)
 */

import axios, { AxiosInstance } from 'axios';

interface GorseFeedback {
    FeedbackType: 'view' | 'purchase' | 'click' | 'like';
    UserId: string;
    ItemId: string;
    Timestamp: string;
    Comment?: string;
}

interface GorseItem {
    ItemId: string;
    IsHidden: boolean;
    Categories: string[];  // e.g., ['BTech', 'CSE', 'Semester-3']
    Timestamp: string;
    Labels: string[];  // e.g., ['DSA', 'Algorithms', 'Data Structures']
    Comment?: string;
}

interface GorseUser {
    UserId: string;
    Labels: string[];  // e.g., ['BTech', 'CSE', 'Anna-University']
    Subscribe: string[];  // Subscribed categories
    Comment?: string;
}

interface RecommendationResult {
    ItemId: string;
    Score: number;
}

class GorseRecommendationService {
    private client: AxiosInstance;
    private apiKey: string;

    constructor() {
        const baseURL = process.env.GORSE_API_URL || 'http://localhost:8087';
        this.apiKey = process.env.GORSE_API_KEY || '';

        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey && { 'X-API-Key': this.apiKey })
            },
            timeout: 10000
        });
    }

    /**
     * Track user interaction with a note
     * This is called on every view, purchase, click
     */
    async trackInteraction(
        userId: string,
        noteId: string,
        feedbackType: 'view' | 'purchase' | 'click' | 'like'
    ): Promise<boolean> {
        try {
            const feedback: GorseFeedback = {
                FeedbackType: feedbackType,
                UserId: userId,
                ItemId: noteId,
                Timestamp: new Date().toISOString()
            };

            await this.client.post('/api/feedback', [feedback]);

            console.log(`✅ Tracked ${feedbackType}: user=${userId}, note=${noteId}`);
            return true;
        } catch (error) {
            console.error('❌ Gorse feedback error:', error);
            return false;
        }
    }

    /**
     * Get personalized recommendations for a user
     */
    async getRecommendationsForUser(
        userId: string,
        limit: number = 20,
        offset: number = 0
    ): Promise<string[]> {
        try {
            const response = await this.client.get(`/api/recommend/${userId}`, {
                params: { n: limit, offset }
            });

            const results: RecommendationResult[] = response.data || [];
            return results.map(r => r.ItemId);
        } catch (error) {
            console.error('❌ Gorse user recommendations error:', error);
            return [];
        }
    }

    /**
     * Get similar notes (item-to-item recommendations)
     * Used for "Similar Notes" section on note detail page
     */
    async getSimilarNotes(
        noteId: string,
        limit: number = 10
    ): Promise<string[]> {
        try {
            const response = await this.client.get(`/api/item/${noteId}/neighbors`, {
                params: { n: limit }
            });

            const results: RecommendationResult[] = response.data || [];
            return results.map(r => r.ItemId);
        } catch (error) {
            console.error('❌ Gorse similar notes error:', error);
            return [];
        }
    }

    /**
     * Get popular notes (global trending)
     * Used for "Trending" section
     */
    async getPopularNotes(
        category?: string,
        limit: number = 20
    ): Promise<string[]> {
        try {
            const endpoint = category
                ? `/api/popular/${category}`
                : '/api/popular';

            const response = await this.client.get(endpoint, {
                params: { n: limit }
            });

            const results: RecommendationResult[] = response.data || [];
            return results.map(r => r.ItemId);
        } catch (error) {
            console.error('❌ Gorse popular notes error:', error);
            return [];
        }
    }

    /**
     * Get latest notes
     * Used for "Recently Added" section
     */
    async getLatestNotes(
        category?: string,
        limit: number = 20
    ): Promise<string[]> {
        try {
            const endpoint = category
                ? `/api/latest/${category}`
                : '/api/latest';

            const response = await this.client.get(endpoint, {
                params: { n: limit }
            });

            const results: { ItemId: string }[] = response.data || [];
            return results.map(r => r.ItemId);
        } catch (error) {
            console.error('❌ Gorse latest notes error:', error);
            return [];
        }
    }

    /**
     * Insert or update a note in Gorse
     * Called when note is created/updated
     */
    async upsertNote(
        noteId: string,
        categories: string[],
        labels: string[],
        isHidden: boolean = false
    ): Promise<boolean> {
        try {
            const item: GorseItem = {
                ItemId: noteId,
                IsHidden: isHidden,
                Categories: categories,  // e.g., ['BTech', 'CSE']
                Labels: labels,  // e.g., ['DSA', 'Algorithms']
                Timestamp: new Date().toISOString()
            };

            await this.client.patch(`/api/item/${noteId}`, item);

            console.log(`✅ Upserted note in Gorse: ${noteId}`);
            return true;
        } catch (error) {
            console.error('❌ Gorse upsert note error:', error);
            return false;
        }
    }

    /**
     * Insert or update user profile in Gorse
     * Called on user registration/profile update
     */
    async upsertUser(
        userId: string,
        labels: string[],  // e.g., ['BTech', 'CSE', 'Semester-3']
        subscribe: string[] = []  // Categories to prioritize
    ): Promise<boolean> {
        try {
            const user: GorseUser = {
                UserId: userId,
                Labels: labels,
                Subscribe: subscribe  // e.g., ['BTech', 'CSE']
            };

            await this.client.patch(`/api/user/${userId}`, user);

            console.log(`✅ Upserted user in Gorse: ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Gorse upsert user error:', error);
            return false;
        }
    }

    /**
     * Delete a note from Gorse
     * Called when note is soft-deleted
     */
    async deleteNote(noteId: string): Promise<boolean> {
        try {
            await this.client.delete(`/api/item/${noteId}`);
            console.log(`✅ Deleted note from Gorse: ${noteId}`);
            return true;
        } catch (error) {
            console.error('❌ Gorse delete note error:', error);
            return false;
        }
    }

    /**
     * Get recommendation statistics
     * For admin/analytics purposes
     */
    async getStats(): Promise<any> {
        try {
            const response = await this.client.get('/api/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Gorse stats error:', error);
            return null;
        }
    }
}

// Singleton instance
export const gorseService = new GorseRecommendationService();

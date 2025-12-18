import axios from '@/lib/api'; // Corrected import to use configured api instance

export interface HeroStat {
    icon?: any; // Icon name string or component
    value: string;
    label: string;
}

export interface SiteContentData {
    // Auth Hero
    title?: string;
    subtitle?: string;
    stats?: HeroStat[];
    backgroundImage?: string;
    gradient?: string;

    // Home Hero
    headline?: string;
    subheadline?: string;
    popularSearches?: string[];

    // Site Identity
    siteName?: string;
    logoUrl?: string;
}

export const contentApi = {
    get: async (section: string): Promise<SiteContentData | null> => {
        try {
            const { data } = await axios.get(`/content/${section}`);
            return data.content;
        } catch (error) {
            console.warn(`Failed to fetch content for ${section}, using fallback.`);
            return null;
        }
    },

    update: async (section: string, content: SiteContentData) => {
        const { data } = await axios.put(`/content/${section}`, { content });
        return data;
    }
};

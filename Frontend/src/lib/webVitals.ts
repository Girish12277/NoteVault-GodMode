/**
 * Core Web Vitals Monitoring Utility
 * Tracks LCP, INP, CLS, FCP, and TTFB metrics
 */

export interface WebVitalMetric {
    name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

// Thresholds based on Google's recommendations
const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },
    INP: { good: 200, poor: 500 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

export function reportWebVitals(metric: WebVitalMetric) {
    // Log to console in development
    if (import.meta.env.DEV) {
        console.log(`[Web Vitals] ${metric.name}:`, {
            value: Math.round(metric.value),
            rating: metric.rating,
            delta: Math.round(metric.delta),
        });
    }

    // Send to analytics in production
    if (import.meta.env.PROD && typeof window !== 'undefined') {
        // Google Analytics 4
        if (window.gtag) {
            window.gtag('event', metric.name, {
                value: Math.round(metric.value),
                metric_id: metric.id,
                metric_value: metric.value,
                metric_delta: metric.delta,
                metric_rating: metric.rating,
            });
        }

        // Custom analytics endpoint (optional)
        navigator.sendBeacon?.('/api/analytics/web-vitals', JSON.stringify({
            metric: metric.name,
            value: Math.round(metric.value),
            rating: metric.rating,
            timestamp: Date.now(),
        }));
    }
}

// Initialize Web Vitals monitoring
export async function initWebVitals() {
    if (typeof window === 'undefined') return;

    try {
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');

        const handleMetric = (metric: any) => {
            reportWebVitals({
                ...metric,
                rating: getRating(metric.name, metric.value),
            });
        };

        onCLS(handleMetric);
        onINP(handleMetric);
        onFCP(handleMetric);
        onLCP(handleMetric);
        onTTFB(handleMetric);
    } catch (error) {
        console.error('Failed to initialize Web Vitals:', error);
    }
}

// Type augmentation for gtag
declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

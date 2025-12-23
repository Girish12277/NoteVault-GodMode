/**
 * Image Optimization Utilities for Core Web Vitals
 * Optimizes images for LCP and overall performance
 */

interface ImageOptimizationOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
}

/**
 * Get optimized Cloudinary URL with transformations
 */
export const getOptimizedImageUrl = (
    url: string,
    options: ImageOptimizationOptions = {}
): string => {
    const { width, quality = 'auto', format = 'auto' } = options;

    // Only optimize Cloudinary URLs
    if (!url || !url.includes('cloudinary')) {
        return url;
    }

    try {
        // Build transformation string
        const transformations: string[] = [];

        if (width) transformations.push(`w_${width}`);
        transformations.push(`f_${format}`);
        transformations.push(`q_${quality}`);
        transformations.push('c_limit'); // Don't upscale

        const transformString = transformations.join(',');

        // Insert transformations after '/upload/'
        return url.replace('/upload/', `/upload/${transformString}/`);
    } catch (error) {
        console.error('Image optimization error:', error);
        return url;
    }
};

/**
 * Generate srcset for responsive images
 */
export const generateSrcSet = (url: string, widths: number[] = [320, 640, 960, 1280, 1920]): string => {
    return widths
        .map(width => `${getOptimizedImageUrl(url, { width })} ${width}w`)
        .join(', ');
};

/**
 * Get image dimensions from URL or default
 */
export const getImageDimensions = (url: string): { width: number; height: number } => {
    // Default dimensions for notes cover images
    return {
        width: 600,
        height: 800,
    };
};

/**
 * Preload critical images for LCP optimization
 */
export const preloadImage = (url: string, options: ImageOptimizationOptions = {}) => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = getOptimizedImageUrl(url, options);

    if (options.width) {
        link.imageSrcset = generateSrcSet(url);
        link.imageSizes = `(max-width: 768px) 100vw, ${options.width}px`;
    }

    document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 */
export const lazyLoadImage = (img: HTMLImageElement) => {
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading
        img.loading = 'lazy';
    } else {
        // Fallback to Intersection Observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLImageElement;
                    if (target.dataset.src) {
                        target.src = target.dataset.src;
                        target.removeAttribute('data-src');
                    }
                    observer.unobserve(target);
                }
            });
        });

        observer.observe(img);
    }
};

/**
 * Generate optimized alt text for SEO
 */
export const generateAltText = (title: string, context?: string): string => {
    const parts = [title];
    if (context) parts.push(context);
    return parts.join(' - ');
};

/**
 * Image component props helper
 */
export interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
}

/**
 * Get optimized image props
 */
export const getOptimizedImageProps = ({
    src,
    alt,
    width,
    height,
    priority = false,
}: OptimizedImageProps) => {
    const dimensions = width && height ? { width, height } : getImageDimensions(src);

    return {
        src: getOptimizedImageUrl(src, { width: dimensions.width }),
        srcSet: generateSrcSet(src),
        sizes: `(max-width: 768px) 100vw, ${dimensions.width}px`,
        alt,
        width: dimensions.width,
        height: dimensions.height,
        loading: priority ? ('eager' as const) : ('lazy' as const),
        decoding: 'async' as const,
        fetchPriority: priority ? ('high' as const) : ('auto' as const),
    };
};

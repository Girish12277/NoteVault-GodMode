import { ImgHTMLAttributes, useState } from 'react';
import { getOptimizedImageUrl, generateSrcSet } from '@/lib/imageOptimization';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
    title?: string; // SEO: Title attribute for additional context
}

/**
 * Generate SEO-friendly title from alt text if not provided
 */
const generateTitle = (alt: string): string => {
    // Capitalize first letter and add context
    return alt.charAt(0).toUpperCase() + alt.slice(1);
};

/**
 * Optimized Image Component for Core Web Vitals & Visual Search SEO
 * - Automatic WebP conversion via Cloudinary
 * - Lazy loading for non-critical images
 * - Responsive srcset generation
 * - Proper width/height to prevent CLS
 * - SEO-optimized alt text and title attributes
 */
export const OptimizedImage = ({
    src,
    alt,
    width,
    height,
    priority = false,
    className = '',
    title,
    ...props
}: OptimizedImageProps) => {
    const [isLoaded, setIsLoaded] = useState(false);

    // Get optimized URL and srcset
    const optimizedSrc = getOptimizedImageUrl(src, { width, format: 'auto' });
    const srcSet = generateSrcSet(src);

    // Fallback dimensions if not provided
    const imgWidth = width || 600;
    const imgHeight = height || 800;

    // Generate title from alt if not provided
    const imgTitle = title || generateTitle(alt);

    return (
        <img
            src={optimizedSrc}
            srcSet={srcSet}
            sizes={`(max-width: 768px) 100vw, ${imgWidth}px`}
            alt={alt}
            title={imgTitle}
            width={imgWidth}
            height={imgHeight}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            onLoad={() => setIsLoaded(true)}
            onError={(e) => {
                // Fallback to placeholder on error
                (e.target as HTMLImageElement).src = 'https://placehold.co/600x800?text=Image+Not+Found';
                setIsLoaded(true);
            }}
            {...props}
        />
    );
};

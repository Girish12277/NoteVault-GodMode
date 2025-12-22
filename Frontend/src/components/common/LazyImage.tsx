import React, { useEffect, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholder?: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * LazyImage Component
 * Implements lazy loading for performance optimization
 * Psychology: Faster page load = neurological trust trigger (subconscious)
 * Target: <1.5s Time to Interactive
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
    className,
    onLoad,
    onError,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState(placeholder);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Create intersection observer for lazy loading
        const img = new Image();

        img.onload = () => {
            setImageSrc(src);
            setIsLoading(false);
            onLoad?.();
        };

        img.onerror = () => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
        };

        // Start loading image
        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, onLoad, onError]);

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            style={{
                opacity: isLoading ? 0.6 : 1,
                transition: 'opacity 0.3s ease-in-out',
            }}
            {...props}
        />
    );
};

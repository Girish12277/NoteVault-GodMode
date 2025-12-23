import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    canonical?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product';
    noindex?: boolean;
}

export const SEOHead = ({
    title,
    description,
    keywords,
    canonical,
    ogImage = 'https://frontend-blue-sigma-18.vercel.app/og-image.jpg',
    ogType = 'website',
    noindex = false,
}: SEOProps) => {
    const baseUrl = 'https://frontend-blue-sigma-18.vercel.app';
    const fullCanonical = canonical || baseUrl;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Canonical URL */}
            <link rel="canonical" href={fullCanonical} />

            {/* Robots */}
            <meta
                name="robots"
                content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}
            />
            <meta name="googlebot" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={fullCanonical} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="NoteVault" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={fullCanonical} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />

            {/* Additional Meta Tags */}
            <meta name="author" content="NoteVault" />
            <meta name="language" content="English" />
            <meta name="revisit-after" content="7 days" />
        </Helmet>
    );
};

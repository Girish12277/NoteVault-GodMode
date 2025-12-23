import { Helmet } from 'react-helmet-async';

interface Note {
    id: string;
    title: string;
    description: string;
    priceInr: number;
    coverImage?: string;
    degree?: string;
    semester?: number;
    totalPages?: number;
    language?: string;
    isActive: boolean;
    averageRating?: number;
    totalReviews?: number;
}

interface ProductSchemaProps {
    note: Note;
}

export const ProductSchema = ({ note }: ProductSchemaProps) => {
    const schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": note.title,
        "image": note.coverImage || "https://frontend-blue-sigma-18.vercel.app/placeholder-note.png",
        "description": note.description,
        "sku": note.id,
        "brand": {
            "@type": "Brand",
            "name": "NoteVault"
        },
        "offers": {
            "@type": "Offer",
            "url": `https://frontend-blue-sigma-18.vercel.app/notes/${note.id}`,
            "priceCurrency": "INR",
            "price": note.priceInr.toString(),
            "priceValidUntil": "2025-12-31",
            "availability": note.isActive
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "NoteVault"
            }
        },
        ...(note.averageRating && note.totalReviews ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": note.averageRating.toString(),
                "reviewCount": note.totalReviews.toString(),
                "bestRating": "5",
                "worstRating": "1"
            }
        } : {}),
        ...(note.degree ? { "category": note.degree } : {}),
        ...(note.semester ? { "educationalLevel": `${note.semester} Semester` } : {}),
        ...(note.language ? {
            "inLanguage": note.language === 'en' ? 'en-IN' : note.language === 'hi' ? 'hi-IN' : 'en-IN'
        } : {}),
        ...(note.totalPages ? { "numberOfPages": note.totalPages.toString() } : {})
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

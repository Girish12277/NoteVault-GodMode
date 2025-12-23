import { Helmet } from 'react-helmet-async';
import { Note } from '@/types';

interface EntityGraphSchemaProps {
    note: Note;
}

/**
 * Entity Graph Schema using @graph and @id
 * Links Organization, Product, and Person entities
 * Creates knowledge graph for better SEO
 */
export const EntityGraphSchema = ({ note }: EntityGraphSchemaProps) => {
    const baseUrl = 'https://frontend-blue-sigma-18.vercel.app';
    const organizationId = `${baseUrl}/#organization`;
    const productId = `${baseUrl}/notes/${note.id}#product`;
    const authorId = `${baseUrl}/seller/${note.sellerId}#person`;

    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            // 1. Organization Entity
            {
                "@type": "EducationalOrganization",
                "@id": organizationId,
                "name": "NoteVault",
                "alternateName": "NotesMarket",
                "url": baseUrl,
                "logo": `${baseUrl}/logo.png`,
                "description": "India's largest marketplace for verified academic notes",
                "foundingDate": "2024",
                "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "IN"
                },
                "areaServed": {
                    "@type": "Country",
                    "name": "India"
                }
            },
            // 2. Person/Author Entity
            {
                "@type": "Person",
                "@id": authorId,
                "name": note.sellerName,
                "jobTitle": "Academic Content Creator",
                ...(note.university ? {
                    "alumniOf": {
                        "@type": "CollegeOrUniversity",
                        "name": note.university
                    }
                } : {}),
                ...(note.degree ? {
                    "hasCredential": {
                        "@type": "EducationalOccupationalCredential",
                        "credentialCategory": note.degree
                    }
                } : {}),
                "knowsAbout": [note.subject]
            },
            // 3. Product Entity (linked to Organization and Author)
            {
                "@type": ["Product", "LearningResource"],
                "@id": productId,
                "name": note.title,
                "description": note.description,
                "image": note.coverImage || `${baseUrl}/placeholder-note.png`,
                "sku": note.id,
                "brand": {
                    "@id": organizationId  // Link to Organization
                },
                "author": {
                    "@id": authorId  // Link to Author
                },
                "provider": {
                    "@id": organizationId  // Link to Organization
                },
                "learningResourceType": "Study Notes",
                "educationalLevel": note.degree,
                "about": {
                    "@type": "Thing",
                    "name": note.subject
                },
                "inLanguage": note.language === 'en' ? 'en-IN' : note.language === 'hi' ? 'hi-IN' : 'en-IN',
                "numberOfPages": note.pages,
                "offers": {
                    "@type": "Offer",
                    "url": `${baseUrl}/notes/${note.id}`,
                    "priceCurrency": "INR",
                    "price": note.price.toString(),
                    "priceValidUntil": "2025-12-31",
                    "itemCondition": "https://schema.org/NewCondition",
                    "availability": note.isActive
                        ? "https://schema.org/InStock"
                        : "https://schema.org/OutOfStock",
                    "seller": {
                        "@id": organizationId  // Link to Organization
                    }
                },
                ...(note.rating && note.reviewCount ? {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": note.rating.toString(),
                        "reviewCount": note.reviewCount.toString(),
                        "bestRating": "5",
                        "worstRating": "1"
                    }
                } : {})
            }
        ]
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

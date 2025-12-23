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
    pages?: number;
    language?: string;
    isActive: boolean;
    averageRating?: number;
    totalReviews?: number;
    subject?: string;
    tableOfContents?: string[];
    sellerName?: string;
}

interface EnhancedProductSchemaProps {
    note: Note;
}

export const EnhancedProductSchema = ({ note }: EnhancedProductSchemaProps) => {
    const schema = {
        "@context": "https://schema.org/",
        "@type": ["Product", "LearningResource"],
        "@id": `https://frontend-blue-sigma-18.vercel.app/notes/${note.id}`,
        "name": note.title,
        "image": note.coverImage || "https://frontend-blue-sigma-18.vercel.app/placeholder-note.png",
        "description": note.description,
        "sku": note.id,
        "brand": {
            "@type": "Brand",
            "name": "NoteVault"
        },
        // LearningResource specific properties
        "learningResourceType": "Study Notes",
        "educationalLevel": note.degree && note.semester
            ? `${note.degree} - Semester ${note.semester}`
            : note.degree || "Higher Education",
        ...(note.subject ? {
            "about": {
                "@type": "Thing",
                "name": note.subject
            }
        } : {}),
        ...(note.tableOfContents && note.tableOfContents.length > 0 ? {
            "teaches": note.tableOfContents
        } : {}),
        ...(note.language ? {
            "inLanguage": note.language === 'en' ? 'en-IN' : note.language === 'hi' ? 'hi-IN' : 'en-IN'
        } : {}),
        "educationalUse": ["Exam Preparation", "Self Study", "Revision"],
        "typicalAgeRange": "18-25",
        "interactivityType": "expositive",
        ...(note.sellerName ? {
            "author": {
                "@type": "Person",
                "name": note.sellerName
            }
        } : {}),
        // Product specific properties
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
            },
            "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                    "@type": "MonetaryAmount",
                    "value": "0",
                    "currency": "INR"
                },
                "deliveryTime": {
                    "@type": "ShippingDeliveryTime",
                    "handlingTime": {
                        "@type": "QuantitativeValue",
                        "minValue": 0,
                        "maxValue": 0,
                        "unitCode": "MIN"
                    }
                },
                "shippingDestination": {
                    "@type": "DefinedRegion",
                    "addressCountry": "IN"
                }
            },
            "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 1,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/FreeReturn"
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
        ...(note.totalPages || note.pages ? {
            "numberOfPages": (note.totalPages || note.pages || 0).toString()
        } : {})
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

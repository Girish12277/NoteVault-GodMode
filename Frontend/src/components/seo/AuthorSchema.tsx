import { Helmet } from 'react-helmet-async';

interface AuthorSchemaProps {
    sellerName: string;
    sellerId: string;
    degree?: string;
    university?: string;
    subjects?: string[];
}

/**
 * Author/Person Schema for E-E-A-T Signals
 * Establishes author authority and expertise
 */
export const AuthorSchema = ({
    sellerName,
    sellerId,
    degree,
    university,
    subjects = []
}: AuthorSchemaProps) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "@id": `https://frontend-blue-sigma-18.vercel.app/seller/${sellerId}#person`,
        "name": sellerName,
        "jobTitle": "Academic Content Creator",
        ...(university ? {
            "alumniOf": {
                "@type": "CollegeOrUniversity",
                "name": university
            }
        } : {}),
        ...(degree ? {
            "hasCredential": {
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": degree
            }
        } : {}),
        ...(subjects.length > 0 ? {
            "knowsAbout": subjects
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

import { Helmet } from 'react-helmet-async';

export const EducationalOrgSchema = () => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "@id": "https://frontend-blue-sigma-18.vercel.app/#organization",
        "name": "NoteVault",
        "alternateName": "NotesMarket",
        "url": "https://frontend-blue-sigma-18.vercel.app",
        "logo": {
            "@type": "ImageObject",
            "url": "https://frontend-blue-sigma-18.vercel.app/logo.png",
            "width": "512",
            "height": "512"
        },
        "description": "India's largest marketplace for verified academic notes. Buy and sell quality study material from top students across 500+ universities.",
        "foundingDate": "2024",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "email": "support@notevault.com",
            "availableLanguage": ["English", "Hindi"]
        },
        "areaServed": {
            "@type": "Country",
            "name": "India"
        },
        "knowsAbout": [
            "Academic Notes",
            "Study Material",
            "BTech Notes",
            "MBA Notes",
            "MBBS Notes",
            "Engineering Education",
            "Exam Preparation"
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

import { Helmet } from 'react-helmet-async';

export const OrganizationSchema = () => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "NoteVault",
        "alternateName": "NotesMarket",
        "url": "https://frontend-blue-sigma-18.vercel.app",
        "logo": "https://frontend-blue-sigma-18.vercel.app/logo.png",
        "description": "India's largest marketplace for verified academic notes. Buy and sell quality study material from top students across 500+ universities.",
        "address": {
            "@type": "PostalAddress",
            "addressCountry": "IN"
        },
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Service",
            "email": "support@notevault.com"
        }
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

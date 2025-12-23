import { Helmet } from 'react-helmet-async';

export const WebSiteSchema = () => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": "https://frontend-blue-sigma-18.vercel.app/#website",
        "name": "NoteVault",
        "alternateName": "NotesMarket",
        "url": "https://frontend-blue-sigma-18.vercel.app",
        "description": "India's largest marketplace for verified academic notes",
        "publisher": {
            "@id": "https://frontend-blue-sigma-18.vercel.app/#organization"
        },
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://frontend-blue-sigma-18.vercel.app/browse?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        },
        "inLanguage": ["en-IN", "hi-IN"]
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

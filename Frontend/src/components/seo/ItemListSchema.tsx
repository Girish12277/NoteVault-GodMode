import { Helmet } from 'react-helmet-async';
import { Note } from '@/types';

interface ItemListSchemaProps {
    notes: Note[];
    listName?: string;
}

export const ItemListSchema = ({ notes, listName = "Academic Notes" }: ItemListSchemaProps) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": listName,
        "numberOfItems": notes.length,
        "itemListElement": notes.map((note, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
                "@type": "Product",
                "@id": `https://frontend-blue-sigma-18.vercel.app/notes/${note.id}`,
                "name": note.title,
                "url": `https://frontend-blue-sigma-18.vercel.app/notes/${note.id}`,
                "image": note.coverImage || "https://frontend-blue-sigma-18.vercel.app/placeholder-note.png",
                "offers": {
                    "@type": "Offer",
                    "price": note.price.toString(),
                    "priceCurrency": "INR",
                    "availability": "https://schema.org/InStock"
                }
            }
        }))
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

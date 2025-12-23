import { Helmet } from 'react-helmet-async';

interface FAQ {
    question: string;
    answer: string;
}

interface FAQSchemaProps {
    faqs: FAQ[];
}

export const FAQSchema = ({ faqs }: FAQSchemaProps) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
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

// Common FAQs for reuse
export const commonFAQs: FAQ[] = [
    {
        question: "How do I download notes after purchase?",
        answer: "After successful payment, notes are instantly available in your Library. Click the 'Download PDF' button to save them to your device. You can access your purchased notes anytime from the Library section."
    },
    {
        question: "What is your refund policy?",
        answer: "We offer a 24-hour money-back guarantee. If you're not satisfied with your purchase, request a refund within 24 hours and we'll process it immediately, no questions asked."
    },
    {
        question: "Are the notes verified and quality-checked?",
        answer: "Yes, all notes are reviewed by our quality assurance team and verified by subject matter experts before being listed on the marketplace. We ensure high-quality, accurate content."
    },
    {
        question: "Can I sell my own notes on NoteVault?",
        answer: "Yes! Create a seller account, upload your notes with proper descriptions, set your price, and start earning. We handle payments and delivery while you earn 90% of the sale price."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major payment methods including credit/debit cards, UPI, net banking, and digital wallets. All transactions are secure and encrypted."
    },
    {
        question: "How quickly can I access notes after purchase?",
        answer: "Instantly! As soon as your payment is confirmed, notes are immediately available in your Library for download. No waiting period."
    }
];

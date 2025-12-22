import React, { useState } from 'react';
import { Download, Mail, BookOpen, CheckSquare, MessageCircle, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReciprocityLadderProps {
    className?: string;
    userEmail?: string;
    onLeadCapture?: (email: string, selectedItem: string) => void;
}

/**
 * ReciprocityLadder Component
 * Give value BEFORE asking for purchase
 * Psychology: Reciprocity - people feel indebted after receiving value
 * 
 * Ladder (strongest to weakest):
 * 1. Free Sample Notes (2-3 pages of premium)
 * 2. Free Study Guide (comprehensive subject overview)
 * 3. Free Revision Checklist (exam prep tool)
 * 4. Free Study Tips (weekly value emails)
 * 5. Free Consultation (chat with buyers)
 */
export const ReciprocityLadder: React.FC<ReciprocityLadderProps> = ({
    className,
    userEmail,
    onLeadCapture,
}) => {
    const [selectedItem, setSelectedItem] = useState<string | null>(null);
    const [email, setEmail] = useState(userEmail || '');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const reciprocityItems = [
        {
            id: 'sample-notes',
            icon: Download,
            title: 'Free Sample Notes',
            description: '2-3 pages from our bestselling notes - see the quality yourself',
            cta: 'Download Free Sample',
            color: 'blue',
            value: 'High',
        },
        {
            id: 'study-guide',
            icon: BookOpen,
            title: 'Free Subject Guide',
            description: 'Comprehensive overview PDF to ace your subject',
            cta: 'Get Free Guide',
            color: 'green',
            value: 'High',
        },
        {
            id: 'revision-checklist',
            icon: CheckSquare,
            title: 'Free Revision Checklist',
            description: 'Exam preparation tool used by 10K+ students',
            cta: 'Download Checklist',
            color: 'purple',
            value: 'Medium',
        },
        {
            id: 'study-tips',
            icon: Mail,
            title: 'Free Weekly Study Tips',
            description: 'Proven strategies delivered to your inbox every week',
            cta: 'Subscribe Free',
            color: 'orange',
            value: 'Medium',
        },
        {
            id: 'consultation',
            icon: MessageCircle,
            title: 'Free Student Chat',
            description: 'Ask questions to students who aced the exam',
            cta: 'Join Chat',
            color: 'indigo',
            value: 'Low',
        },
    ];

    const handleSubmit = (itemId: string) => {
        if (!email) return;

        setSelectedItem(itemId);
        setHasSubmitted(true);
        onLeadCapture?.(email, itemId);
    };

    if (hasSubmitted && selectedItem) {
        const item = reciprocityItems.find(i => i.id === selectedItem);

        return (
            <div className={cn('max-w-2xl mx-auto p-6 text-center', className)}>
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-green-100 mb-6">
                    <Gift className="h-12 w-12 text-green-600" />
                </div>

                <h2 className="text-3xl font-bold text-foreground mb-3">
                    Check your email! 📧
                </h2>

                <p className="text-lg text-muted-foreground mb-6">
                    We've sent "{item?.title}" to <strong>{email}</strong>
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <p className="text-sm text-blue-800 font-medium">
                        💡 Pro tip: Add us to your contacts so you don't miss future freebies
                    </p>
                </div>

                <button
                    onClick={() => setHasSubmitted(false)}
                    className="text-sm text-primary hover:underline"
                >
                    Get more free resources →
                </button>
            </div>
        );
    }

    return (
        <div className={cn('max-w-4xl mx-auto p-6', className)}>
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-3">
                    Free Resources to Boost Your Grades 🎁
                </h2>
                <p className="text-lg text-muted-foreground">
                    No payment. No catch. Just value.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                {reciprocityItems.map((item) => {
                    const Icon = item.icon;
                    const colorClasses = {
                        blue: 'bg-blue-50 border-blue-200 text-blue-600',
                        green: 'bg-green-50 border-green-200 text-green-600',
                        purple: 'bg-purple-50 border-purple-200 text-purple-600',
                        orange: 'bg-orange-50 border-orange-200 text-orange-600',
                        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
                    };

                    return (
                        <div
                            key={item.id}
                            className="p-6 rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all group"
                        >
                            <div className={cn('inline-flex p-3 rounded-lg mb-4', colorClasses[item.color as keyof typeof colorClasses])}>
                                <Icon className="h-6 w-6" />
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                {item.title}
                            </h3>

                            <p className="text-sm text-muted-foreground mb-4">
                                {item.description}
                            </p>

                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-3 py-2 rounded border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                />
                            </div>

                            <button
                                onClick={() => handleSubmit(item.id)}
                                disabled={!email}
                                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {item.cta}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Trust Signal */}
            <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">
                    Join <strong className="text-foreground">15,000+ students</strong> getting free study resources weekly
                </p>
            </div>
        </div>
    );
};

/**
 * LeadMagnet Component
 * Compact version for homepage/product pages
 */
interface LeadMagnetProps {
    title?: string;
    description?: string;
    magnetType?: 'sample' | 'guide' | 'checklist' | 'tips';
    className?: string;
    onSubmit?: (email: string) => void;
}

export const LeadMagnet: React.FC<LeadMagnetProps> = ({
    title = 'Get Free Sample Notes',
    description = 'See the quality before you buy - no credit card required',
    magnetType = 'sample',
    className,
    onSubmit,
}) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setSubmitted(true);
        onSubmit?.(email);
    };

    if (submitted) {
        return (
            <div className={cn('p-6 rounded-lg bg-green-50 border border-green-200', className)}>
                <div className="text-center">
                    <div className="inline-flex p-3 rounded-full bg-green-100 mb-3">
                        <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-bold text-green-900 mb-2">Check your email! 📧</h3>
                    <p className="text-sm text-green-700">
                        Your free sample has been sent to <strong>{email}</strong>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('p-6 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20', className)}>
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
                <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                    type="submit"
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                    Get Free {magnetType === 'sample' ? 'Sample' : magnetType === 'guide' ? 'Guide' : magnetType === 'checklist' ? 'Checklist' : 'Tips'}
                </button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-3">
                No spam. Unsubscribe anytime.
            </p>
        </div>
    );
};

import React, { useState } from 'react';
import { Gift, Star, Mail, Download, CheckCircle2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PurchaseConfirmationProps {
    userName: string;
    productTitle: string;
    bonusContent?: string[];
    className?: string;
}

/**
 * PurchaseConfirmation Component
 * Peak-End Rule: Peak Moment (during purchase)
 * Psychology: Memory distortion - peak moment defines entire experience
 * 
 * Peak Moment Elements:
 * 1. Surprise bonus (unexpected reward)
 * 2. Personalized thank-you (individual recognition)
 * 3. Instant access confirmation (immediate gratification)
 * 4. Community welcome (belonging)
 */
export const PurchaseConfirmation: React.FC<PurchaseConfirmationProps> = ({
    userName,
    productTitle,
    bonusContent = ['Formula Sheet', 'Quick Revision Guide'],
    className,
}) => {
    const [hasShownConfetti, setHasShownConfetti] = useState(false);

    React.useEffect(() => {
        if (!hasShownConfetti) {
            // Trigger confetti animation (peak moment)
            setHasShownConfetti(true);
        }
    }, [hasShownConfetti]);

    return (
        <div className={cn('max-w-2xl mx-auto p-6', className)}>
            {/* Success Animation */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="flex items-center justify-center mb-6"
            >
                <div className="p-6 rounded-full bg-green-100 relative">
                    <CheckCircle2 className="h-16 w-16 text-green-600" />
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="absolute inset-0 rounded-full bg-green-400/30"
                    />
                </div>
            </motion.div>

            {/* Personalized Thank You */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-8"
            >
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    Thanks {userName}! 🎉
                </h1>
                <p className="text-lg text-muted-foreground">
                    You're now part of <strong className="text-foreground">50,000+ students</strong> who upgraded their grades
                </p>
            </motion.div>

            {/* Instant Access Confirmation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6"
            >
                <div className="flex items-start gap-3">
                    <Download className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="font-bold text-blue-900 mb-2">Your Notes Are Ready!</h3>
                        <p className="text-sm text-blue-700 mb-3">
                            "{productTitle}" has been added to your library
                        </p>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                            Download Now
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Surprise Bonus (PEAK MOMENT) */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, type: 'spring' }}
                className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-6 mb-6"
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <Gift className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-purple-900">Surprise Bonus!</h3>
                            <Sparkles className="h-4 w-4 text-purple-600" />
                        </div>
                        <p className="text-sm text-purple-700 mb-3">
                            We've included these extras - absolutely FREE:
                        </p>
                        <div className="space-y-2">
                            {bonusContent.map((bonus, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-purple-800">
                                    <Star className="h-4 w-4 fill-purple-400 text-purple-400" />
                                    <span>{bonus}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Email Confirmation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center"
            >
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                    <Mail className="h-4 w-4" />
                    <span>Confirmation email sent to your inbox</span>
                </div>

                {/* Community Welcome */}
                <p className="text-sm text-muted-foreground">
                    Need help? Our student community is here for you 24/7
                </p>
            </motion.div>
        </div>
    );
};

/**
 * PostPurchaseFollowUp Component
 * Peak-End Rule: End Moment (7 days post-purchase)
 * Psychology: End moment defines lasting memory
 */
interface PostPurchaseFollowUpProps {
    userName: string;
    purchaseDate: Date;
    productTitle: string;
    className?: string;
}

export const PostPurchaseFollowUp: React.FC<PostPurchaseFollowUpProps> = ({
    userName,
    purchaseDate,
    productTitle,
    className,
}) => {
    const daysSincePurchase = Math.floor(
        (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePurchase !== 7) return null;

    return (
        <div className={cn('max-w-2xl mx-auto p-6 bg-card border border-border rounded-lg', className)}>
            <h2 className="text-2xl font-bold text-foreground mb-4">
                Hey {userName}, how are the notes helping? 📚
            </h2>

            <p className="text-muted-foreground mb-6">
                It's been a week since you got "{productTitle}". We'd love to know how it's going!
            </p>

            {/* Feedback Buttons */}
            <div className="space-y-3 mb-6">
                <button className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary">
                                😍 Amazing! Helped me score better
                            </p>
                            <p className="text-sm text-muted-foreground">Leave a review & get surprise bonus</p>
                        </div>
                    </div>
                </button>

                <button className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary">
                                👍 Good, but could use more practice questions
                            </p>
                            <p className="text-sm text-muted-foreground">We'll send you bonus practice material</p>
                        </div>
                    </div>
                </button>

                <button className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary">
                                😕 Not quite what I expected
                            </p>
                            <p className="text-sm text-muted-foreground">Let's make it right - full refund available</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Surprise Gift (END MOMENT) */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Gift className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-green-900 mb-1">Thanks for being awesome! 🎁</h3>
                        <p className="text-sm text-green-700 mb-2">
                            Here's a free summary sheet for your next exam
                        </p>
                        <button className="text-sm font-semibold text-green-700 hover:text-green-800 underline">
                            Download Free Summary →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Email Templates (for backend implementation)
 */
export const PeakEndEmailTemplates = {
    // Peak Moment: Immediate post-purchase
    purchaseConfirmation: {
        subject: (name: string) => `🎉 ${name}, your notes are ready!`,
        body: (name: string, product: string, bonuses: string[]) => `
Hi ${name}!

Thank you for your purchase! You're now part of 50,000+ students who are crushing their exams.

YOUR NOTES ARE READY:
"${product}" is now in your library

SURPRISE BONUS - FREE! 🎁
${bonuses.map(b => `✓ ${b}`).join('\n')}

Download now: [LINK]

Need help? Reply to this email anytime.

To your success,
The StudyVault Team
    `,
    },

    // End Moment: 7-day follow-up
    sevenDayFollowUp: {
        subject: (name: string) => `${name}, how are the notes helping? (+ free bonus inside)`,
        body: (name: string, product: string) => `
Hey ${name},

It's been a week since you got "${product}". How's it going?

Quick question: Are the notes helping you prepare?

[ Reply with: Amazing! | Good | Could be better ]

AND BECAUSE YOU'RE AWESOME...

Here's a FREE summary sheet for your next exam 📝

Download: [LINK]

P.S. Early access to our next notes collection launching soon. You'll be first to know!

Cheers,
The StudyVault Team
    `,
    },

    // Exclusive offer (14 days)
    exclusiveOffer: {
        subject: (name: string) => `${name}, early access just for you 🌟`,
        body: (name: string) => `
Hi ${name},

You're one of our favorite students (seriously).

NEW NOTES DROPPING SOON - Early Access

You get:
✓ 24-hour head start before public release
✓ 20% founding member discount
✓ Bonus study materials included

Interested? Reply "YES" and we'll send details.

Thanks for being part of our community,
The StudyVault Team
    `,
    },
};

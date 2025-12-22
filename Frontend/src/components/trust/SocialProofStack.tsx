import React, { useEffect, useState } from 'react';
import { Eye, TrendingUp, Star, Award, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentPurchase {
    name: string;
    location: string;
    timeAgo: string;
    productTitle?: string;
}

interface SocialProofStackProps {
    className?: string;
    reviewCount?: number;
    averageRating?: number;
    recentPurchaseCount?: number;
    bestsellerRank?: string;
    viewCount?: number;
    showRecentPurchases?: boolean;
    showBestseller?: boolean;
    showViewCount?: boolean;
    productId?: string;
}

/**
 * SocialProofStack Component
 * Multiple proof sources create impossible-to-ignore credibility
 * Psychology: Visual density of proof makes skepticism irrational
 */
export const SocialProofStack: React.FC<SocialProofStackProps> = ({
    className,
    reviewCount = 2847,
    averageRating = 4.8,
    recentPurchaseCount = 156,
    bestsellerRank = '#1 in Engineering Notes',
    viewCount = 3420,
    showRecentPurchases = true,
    showBestseller = true,
    showViewCount = true,
    productId,
}) => {
    const [currentPurchase, setCurrentPurchase] = useState(0);
    const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([
        { name: 'Rahul S.', location: 'IIT Delhi', timeAgo: '5 mins ago' },
        { name: 'Priya M.', location: 'Mumbai', timeAgo: '12 mins ago' },
        { name: 'Arjun K.', location: 'Bangalore', timeAgo: '28 mins ago' },
        { name: 'Sneha P.', location: 'Pune', timeAgo: '1 hour ago' },
    ]);

    // Rotate through recent purchases
    useEffect(() => {
        if (!showRecentPurchases || recentPurchases.length === 0) return;

        const interval = setInterval(() => {
            setCurrentPurchase((prev) => (prev + 1) % recentPurchases.length);
        }, 5000); // Change every 5 seconds

        return () => clearInterval(interval);
    }, [recentPurchases.length, showRecentPurchases]);

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    return (
        <div className={cn('space-y-3', className)}>
            {/* Reviews */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                'h-4 w-4',
                                star <= Math.floor(averageRating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                            )}
                        />
                    ))}
                </div>
                <span className="text-sm font-semibold text-foreground">
                    {averageRating}
                </span>
                <span className="text-sm text-muted-foreground">
                    ({formatNumber(reviewCount)} verified reviews)
                </span>
            </div>

            {/* Recent Purchases Notification */}
            {showRecentPurchases && recentPurchases.length > 0 && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPurchase}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200"
                    >
                        <div className="p-1 rounded-full bg-blue-100">
                            <Users className="h-3 w-3 text-blue-600" />
                        </div>
                        <p className="text-xs text-blue-700 flex-1">
                            <strong>{recentPurchases[currentPurchase].name}</strong> from{' '}
                            {recentPurchases[currentPurchase].location} bought this{' '}
                            <span className="text-blue-600 font-medium">
                                {recentPurchases[currentPurchase].timeAgo}
                            </span>
                        </p>
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Purchase Count (24h) */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span>
                    <strong className="text-green-600 font-semibold">
                        {recentPurchaseCount}
                    </strong>{' '}
                    students bought in last 24 hours
                </span>
            </div>

            {/* Bestseller Badge */}
            {showBestseller && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-700">
                        {bestsellerRank}
                    </span>
                </div>
            )}

            {/* View Count */}
            {showViewCount && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    <span>{formatNumber(viewCount)} students viewing this week</span>
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { Clock, AlertCircle, Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthenticScarcityProps {
    className?: string;
    variant?: 'inventory' | 'exam' | 'flash' | 'seller-limited';
    stockCount?: number;
    daysUntilExam?: number;
    flashEndTime?: Date;
    sellerLimit?: number;
    soldCount?: number;
    showUrgency?: boolean;
}

/**
 * AuthenticScarcity Component
 * ETHICAL scarcity implementation - NEVER fake
 * Psychology: Real scarcity activates dopamine/norepinephrine urgency
 * 
 * RULES:
 * ✅ ALLOWED: Real inventory, real exam deadlines, real seller limits
 * ❌ FORBIDDEN: Fake countdown, false "only 2 left", perpetual urgency
 */
export const AuthenticScarcity: React.FC<AuthenticScarcityProps> = ({
    className,
    variant = 'inventory',
    stockCount = 0,
    daysUntilExam = 0,
    flashEndTime,
    sellerLimit = 0,
    soldCount = 0,
    showUrgency = true,
}) => {
    // Inventory scarcity
    if (variant === 'inventory' && stockCount > 0 && stockCount < 10) {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
                    'bg-orange-50 border border-orange-200',
                    'text-sm font-semibold text-orange-700',
                    className
                )}
            >
                <AlertCircle className="h-4 w-4" />
                <span>Only {stockCount} left at current price</span>
            </div>
        );
    }

    // Exam urgency (authentic - based on actual exam dates)
    if (variant === 'exam' && daysUntilExam > 0 && daysUntilExam < 14) {
        const urgencyLevel = daysUntilExam <= 3 ? 'critical' : daysUntilExam <= 7 ? 'high' : 'medium';

        return (
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg',
                    urgencyLevel === 'critical' && 'bg-red-50 border border-red-200',
                    urgencyLevel === 'high' && 'bg-orange-50 border border-orange-200',
                    urgencyLevel === 'medium' && 'bg-yellow-50 border border-yellow-200',
                    className
                )}
            >
                <Clock
                    className={cn(
                        'h-5 w-5',
                        urgencyLevel === 'critical' && 'text-red-600',
                        urgencyLevel === 'high' && 'text-orange-600',
                        urgencyLevel === 'medium' && 'text-yellow-600'
                    )}
                />
                <div>
                    <p
                        className={cn(
                            'font-bold text-sm',
                            urgencyLevel === 'critical' && 'text-red-900',
                            urgencyLevel === 'high' && 'text-orange-900',
                            urgencyLevel === 'medium' && 'text-yellow-900'
                        )}
                    >
                        {urgencyLevel === 'critical' && 'Exam in ' + daysUntilExam + ' days! ⚠️'}
                        {urgencyLevel === 'high' && 'Finals approaching - ' + daysUntilExam + ' days left'}
                        {urgencyLevel === 'medium' && 'Exam in ' + daysUntilExam + ' days'}
                    </p>
                    {showUrgency && (
                        <p className="text-xs text-muted-foreground">
                            Prepare now while notes are available
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Flash sale (real countdown - must have actual end time)
    if (variant === 'flash' && flashEndTime && flashEndTime > new Date()) {
        const timeLeft = flashEndTime.getTime() - new Date().getTime();
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        return (
            <div
                className={cn(
                    'flex items-center gap-3 px-4 py-2 rounded-lg',
                    'bg-gradient-to-r from-red-50 to-orange-50',
                    'border border-red-200',
                    className
                )}
            >
                <Flame className="h-5 w-5 text-red-600 animate-pulse" />
                <div>
                    <p className="font-bold text-red-900 text-sm">Flash Sale Ending Soon!</p>
                    <p className="text-xs text-red-700">
                        {hours}h {minutes}m remaining
                    </p>
                </div>
            </div>
        );
    }

    // Seller-limited (authentic - seller sets limit)
    if (variant === 'seller-limited' && sellerLimit > 0 && soldCount < sellerLimit) {
        const remaining = sellerLimit - soldCount;
        const percentSold = (soldCount / sellerLimit) * 100;

        return (
            <div
                className={cn(
                    'space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-200',
                    className
                )}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">
                            Limited Release
                        </span>
                    </div>
                    <span className="text-xs font-medium text-blue-700">
                        {remaining}/{sellerLimit} available
                    </span>
                </div>
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-500',
                            percentSold > 80 ? 'bg-red-500' : percentSold > 50 ? 'bg-orange-500' : 'bg-blue-500'
                        )}
                        style={{ width: `${percentSold}%` }}
                    />
                </div>
                {percentSold > 80 && (
                    <p className="text-xs text-red-700 font-medium">
                        ⚠️ Almost sold out - seller limiting to {sellerLimit} students
                    </p>
                )}
            </div>
        );
    }

    // Return null if no valid scarcity condition
    return null;
};

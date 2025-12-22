import React from 'react';
import { Shield, Users, Award, Clock, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustStackProps {
    className?: string;
    variant?: 'full' | 'compact' | 'minimal';
    showGuarantee?: boolean;
    showReviews?: boolean;
    showCustomerCount?: boolean;
    showVerification?: boolean;
    showSecurity?: boolean;
    reviewCount?: number;
    averageRating?: number;
    customerCount?: number;
}

/**
 * TrustStack Component
 * Multi-layered authority signals for neurological trust building
 * Based on sales psychology: Multiple stacked proofs create exponential trust
 */
export const TrustStack: React.FC<TrustStackProps> = ({
    className,
    variant = 'full',
    showGuarantee = true,
    showReviews = true,
    showCustomerCount = true,
    showVerification = true,
    showSecurity = true,
    reviewCount = 2847,
    averageRating = 4.8,
    customerCount = 50000,
}) => {
    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(0)}K+`;
        }
        return num.toString();
    };

    const trustItems = [
        {
            show: showReviews,
            icon: Award,
            text: `${averageRating}★ from ${formatNumber(reviewCount)} verified students`,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            show: showCustomerCount,
            icon: Users,
            text: `Trusted by ${formatNumber(customerCount)} students`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            show: showGuarantee,
            icon: Shield,
            text: '30-Day Money-Back Guarantee',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            show: showVerification,
            icon: CheckCircle2,
            text: 'Verified Seller',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
        {
            show: showSecurity,
            icon: Lock,
            text: 'Secure Payment (Razorpay)',
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
        },
    ].filter(item => item.show);

    if (variant === 'minimal') {
        return (
            <div className={cn('flex items-center gap-3 flex-wrap', className)}>
                {showReviews && (
                    <div className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                        <Award className="h-4 w-4" />
                        <span>{averageRating}★</span>
                    </div>
                )}
                {showGuarantee && (
                    <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <Shield className="h-4 w-4" />
                        <span>Money-Back</span>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={cn('flex flex-col gap-2', className)}>
                {trustItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            <Icon className={cn('h-4 w-4', item.color)} />
                            <span className="text-foreground/80 font-medium">{item.text}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={cn('rounded-lg border border-border/50 bg-card p-4 shadow-sm', className)}>
            <h3 className="text-sm font-semibold text-foreground/90 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Why Students Trust Us
            </h3>
            <div className="space-y-2">
                {trustItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={index}
                            className={cn(
                                'flex items-center gap-3 p-2 rounded-md transition-colors',
                                item.bgColor
                            )}
                        >
                            <Icon className={cn('h-5 w-5 flex-shrink-0', item.color)} />
                            <span className="text-sm font-medium text-foreground">{item.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

import React from 'react';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MoneyBackGuaranteeProps {
    className?: string;
    variant?: 'badge' | 'banner' | 'section';
    showDetails?: boolean;
    days?: number;
}

/**
 * MoneyBackGuarantee Component
 * Risk reversal as trust intensifier
 * Psychology: Eliminates primary barrier (financial risk) to purchase
 */
export const MoneyBackGuarantee: React.FC<MoneyBackGuaranteeProps> = ({
    className,
    variant = 'badge',
    showDetails = false,
    days = 30,
}) => {
    if (variant === 'badge') {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 rounded-full',
                    'bg-green-50 border border-green-200 text-green-700',
                    'text-sm font-semibold',
                    className
                )}
            >
                <Shield className="h-4 w-4" />
                <span>{days}-Day Money-Back Guarantee</span>
            </div>
        );
    }

    if (variant === 'banner') {
        return (
            <div
                className={cn(
                    'flex items-center justify-between gap-4 p-4 rounded-lg',
                    'bg-gradient-to-r from-green-50 to-emerald-50',
                    'border border-green-200',
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100">
                        <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-green-900">{days}-Day Risk-Free Guarantee</h4>
                        <p className="text-sm text-green-700">
                            Not satisfied? Get 100% refund - no questions asked
                        </p>
                    </div>
                </div>
                {showDetails && (
                    <Link
                        to="/guarantee"
                        className="flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800 transition-colors whitespace-nowrap"
                    >
                        Learn more
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
        );
    }

    // Section variant (full detailed explanation)
    return (
        <div
            className={cn(
                'p-6 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50',
                className
            )}
        >
            <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-green-100 ring-4 ring-green-50">
                    <Shield className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold text-green-900 mb-2">
                        {days}-Day Perfect Notes Guarantee
                    </h3>
                    <p className="text-lg text-green-800 mb-4 leading-relaxed">
                        If these notes don't help you score better, we'll refund 100% - no questions asked.
                    </p>
                    <div className="space-y-3 mb-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">
                                <strong>Full refund</strong> if notes don't match description
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">
                                <strong>No questions asked</strong> - we process refunds within 24 hours
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700">
                                <strong>You risk nothing.</strong> We risk everything.
                            </p>
                        </div>
                    </div>
                    <p className="text-sm text-green-600 font-semibold italic">
                        We're confident in our notes because thousands of students have scored 90+ using them.
                    </p>
                </div>
            </div>
        </div>
    );
};

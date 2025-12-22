import React from 'react';
import { Shield, Award, Lock, CheckCircle2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthoritySignalsProps {
    className?: string;
    variant?: 'footer' | 'header' | 'checkout' | 'inline';
    showUniversities?: boolean;
    showPaymentBadges?: boolean;
    showSecurity?: boolean;
    showCustomerCount?: boolean;
}

/**
 * AuthoritySignals Component
 * Displays credibility markers and authority badges
 * Psychology: Established = trustworthy (status quo bias)
 */
export const AuthoritySignals: React.FC<AuthoritySignalsProps> = ({
    className,
    variant = 'footer',
    showUniversities = true,
    showPaymentBadges = true,
    showSecurity = true,
    showCustomerCount = true,
}) => {
    const universities = [
        'IIT Delhi',
        'IIT Bombay',
        'NIT Trichy',
        'BITS Pilani',
        'DTU',
    ];

    if (variant === 'header') {
        return (
            <div className={cn('flex items-center gap-4 text-sm', className)}>
                {showCustomerCount && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                            <strong className="text-foreground">50K+</strong> students
                        </span>
                    </div>
                )}
                {showSecurity && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Lock className="h-4 w-4 text-green-600" />
                        <span>Secure</span>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'checkout') {
        return (
            <div className={cn('space-y-3', className)}>
                {/* Security Badges */}
                {showSecurity && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-50 border border-green-200">
                            <Lock className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">256-bit SSL Encryption</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-blue-50 border border-blue-200">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">PCI Compliant</span>
                        </div>
                    </div>
                )}

                {/* Payment Badges */}
                {showPaymentBadges && (
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="font-semibold">Powered by</span>
                            <span className="px-2 py-1 bg-primary/5 rounded font-bold text-primary">Razorpay</span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className={cn('flex items-center gap-3 flex-wrap text-xs text-muted-foreground', className)}>
                {showSecurity && (
                    <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3 text-green-600" />
                        <span>Secure</span>
                    </div>
                )}
                {showPaymentBadges && (
                    <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                        <span>Razorpay</span>
                    </div>
                )}
            </div>
        );
    }

    // Footer variant (default)
    return (
        <div className={cn('space-y-6', className)}>
            {/* Trusted Universities */}
            {showUniversities && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                        Trusted by Students From
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {universities.map((uni) => (
                            <div
                                key={uni}
                                className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
                            >
                                {uni}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Payment & Security */}
            <div className="flex flex-wrap items-center gap-6">
                {showPaymentBadges && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Secure Payments</p>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-primary/5 rounded font-bold text-sm text-primary">
                                Razorpay
                            </div>
                            <Lock className="h-4 w-4 text-green-600" />
                        </div>
                    </div>
                )}

                {showSecurity && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Security</p>
                        <div className="flex items-center gap-2 text-sm text-foreground/80">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <span>256-bit SSL</span>
                        </div>
                    </div>
                )}

                {showCustomerCount && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Community</p>
                        <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span className="font-semibold text-foreground">50,000+ Students</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

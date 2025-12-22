import React from 'react';
import { cn } from '@/lib/utils';
import { type StudentArchetype } from '../personalization';

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'success' | 'urgency' | 'premium';
    size?: 'sm' | 'md' | 'lg';
    copy?: 'default' | 'action' | 'benefit' | 'urgency' | 'personalized';
    archetype?: StudentArchetype | null;
    fullWidth?: boolean;
    showGuarantee?: boolean;
}

/**
 * CTAButton Component
 * Optimized call-to-action with color + copy psychology
 * Psychology: Color triggers neurological response, copy frames action
 * 
 * Color Psychology:
 * - Primary (Blue): Trust, logic, stability - for standard purchases
 * - Success (Green): Safety, continuation - reduces purchase anxiety  
 * - Urgency (Orange/Red): Action, scarcity - for time-limited offers
 * - Premium (Black): Exclusivity, luxury - for high-value items
 */
export const CTAButton: React.FC<CTAButtonProps> = ({
    variant = 'success',
    size = 'md',
    copy = 'default',
    archetype = null,
    fullWidth = false,
    showGuarantee = false,
    className,
    children,
    ...props
}) => {
    // Color variants (neurological optimization)
    const variantClasses = {
        primary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
        success: 'bg-green-600 hover:bg-green-700 text-white', // Reduces anxiety
        urgency: 'bg-orange-600 hover:bg-orange-700 text-white', // Creates action
        premium: 'bg-gray-900 hover:bg-gray-800 text-white', // Signals exclusivity
    };

    // Size variants
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg',
    };

    // Copy variants (psychological framing)
    const getCopyText = (): string => {
        if (children) return children.toString();

        // Personalized copy based on archetype
        if (copy === 'personalized' && archetype) {
            const archetypeCopy = {
                optimizer: 'Get Better Grades',
                crammer: 'Instant Download',
                thorough: 'Master the Subject',
                budget: 'Get Best Value',
            };
            return archetypeCopy[archetype];
        }

        // Copy frameworks
        const copyFrameworks = {
            default: 'Buy Now',
            action: 'Get Instant Access', // Removes barrier ("buy" = loss frame)
            benefit: 'Start Studying Now', // Outcome-focused
            urgency: 'Claim Your Notes', // Scarcity + ownership frame
        };

        return copyFrameworks[copy];
    };

    return (
        <div className={cn('inline-flex flex-col gap-2', fullWidth && 'w-full')}>
            <button
                className={cn(
                    'font-semibold rounded-lg transition-all duration-200',
                    'shadow-sm hover:shadow-md active:scale-98',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    variant === 'success' && 'focus:ring-green-500',
                    variant === 'urgency' && 'focus:ring-orange-500',
                    variant === 'primary' && 'focus:ring-primary',
                    variant === 'premium' && 'focus:ring-gray-700',
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {getCopyText()}
            </button>

            {/* Optional guarantee badge */}
            {showGuarantee && (
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <svg
                        className="h-3 w-3 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                    </svg>
                    <span>30-day money-back guarantee</span>
                </p>
            )}
        </div>
    );
};

/**
 * A/B Testing Variants
 * Use these for split testing
 */
export const CTAVariants = {
    // Color tests
    colorTest: {
        control: { variant: 'primary' as const, copy: 'default' as const },
        variantA: { variant: 'success' as const, copy: 'default' as const },
        variantB: { variant: 'urgency' as const, copy: 'default' as const },
    },

    // Copy tests
    copyTest: {
        control: { variant: 'success' as const, copy: 'default' as const },
        variantA: { variant: 'success' as const, copy: 'action' as const },
        variantB: { variant: 'success' as const, copy: 'benefit' as const },
        variantC: { variant: 'success' as const, copy: 'urgency' as const },
    },

    // Guarantee tests
    guaranteeTest: {
        control: { variant: 'success' as const, showGuarantee: false },
        variantA: { variant: 'success' as const, showGuarantee: true },
    },
};

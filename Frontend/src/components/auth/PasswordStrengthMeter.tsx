
import React from 'react';
import { PasswordFeedback } from '../../logic/passwordSecurity';

interface PasswordStrengthMeterProps {
    feedback: PasswordFeedback;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ feedback }) => {
    const { score, isStrong, feedback: { warning, suggestions } } = feedback;

    // Visual Semantics (Phase 0)
    // 0: Gray/Red (Empty/Weak)
    // 1: Red (Weak)
    // 2: Orange (Marginal)
    // 3: Green (Acceptable)
    // 4: Emerald (Strong)

    const getColor = (s: number) => {
        if (s <= 1) return 'bg-destructive';
        if (s === 2) return 'bg-yellow-500';
        if (s === 3) return 'bg-green-500';
        return 'bg-emerald-600';
    };

    const color = getColor(score);
    const width = `${(score + 1) * 20}%`; // 20, 40, 60, 80, 100

    return (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-300 ${color}`}
                    style={{ width: `${Math.max(5, score * 25)}%` }} // 0=>5%, 1=>25%, 2=>50%, 3=>75%, 4=>100%
                />
            </div>

            <div className="flex justify-between items-start text-xs">
                <span className={`font-medium ${score >= 3 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {score === 0 ? 'Too Weak' : score === 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Excellent'}
                </span>
                {warning && (
                    <span className="text-destructive text-right max-w-[200px] leading-tight">
                        {warning}
                    </span>
                )}
            </div>

            {!isStrong && suggestions.length > 0 && (
                <p className="text-[10px] text-muted-foreground italic">
                    Tip: {suggestions[0]}
                </p>
            )}
        </div>
    );
};

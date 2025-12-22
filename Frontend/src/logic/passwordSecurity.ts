
import zxcvbn from 'zxcvbn';

// OMEGA Phase 0 Standards
export const PASS_CONSTANTS = {
    MIN_LENGTH: 8,
    MIN_SCORE: 3, // 0-4 scale. 3 = "safely unguessable", 4 = "strong". 2 is weak.
    MAX_LENGTH: 128,
};

export interface PasswordFeedback {
    score: number; // 0-4
    feedback: {
        warning: string;
        suggestions: string[];
    };
    isStrong: boolean;
    crackTime: string;
}

// OMEGA PHASE 11: LEAK DATABASE SIMULATION
// Real systems would query a 10GB+ DB (HIBP). We simulate this with iconic leaks.
const LEAK_BLACKLIST = new Set([
    'password', 'password123', 'admin', '123456',
    'correcthorsebatterystaple', // XKCD
    'Tr0ub4dor&3',               // XKCD
    'iloveyou', 'qwerty'
]);

export function evaluatePassword(password: string): PasswordFeedback {
    if (!password) {
        return {
            score: 0,
            feedback: { warning: '', suggestions: [] },
            isStrong: false,
            crackTime: 'instant'
        };
    }

    const result = zxcvbn(password);

    // OMEGA PHASE 11: LEAK DB CHECK
    if (LEAK_BLACKLIST.has(password)) {
        return {
            score: 0,
            feedback: {
                warning: 'This password has been leaked in a data breach.',
                suggestions: ['Choose a password that has not been exposed.']
            },
            isStrong: false,
            crackTime: 'instant'
        };
    }

    // OMEGA PHASE 5: SECURITY ABSOLUTISM (UNICODE/ZERO-WIDTH SANITIZATION)
    // Strip zero-width spaces, joiners, and BOM to prevent length spoofing.
    // Also normalize to NFKC to ensure consistent length for composite characters.
    const sanitized = password.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Custom Enforcement Override for Short Passwords even if "complex"
    if (sanitized.length < PASS_CONSTANTS.MIN_LENGTH) {
        return {
            score: Math.min(result.score, 1), // Cap score for short passwords
            feedback: {
                warning: 'Too short',
                suggestions: [`Add another word or two. Minimum ${PASS_CONSTANTS.MIN_LENGTH} characters.`]
            },
            isStrong: false,
            crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second)
        };
    }

    return {
        score: result.score,
        feedback: result.feedback,
        isStrong: result.score >= PASS_CONSTANTS.MIN_SCORE,
        crackTime: String(result.crack_times_display.offline_slow_hashing_1e4_per_second)
    };
}

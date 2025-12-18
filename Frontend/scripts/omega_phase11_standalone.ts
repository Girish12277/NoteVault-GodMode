
// scripts/omega_phase11_standalone.ts
import zxcvbn from 'zxcvbn';

// 1. CONSTANTS
const PASS_CONSTANTS = {
    MIN_LENGTH: 8,
    MIN_SCORE: 3,
    MAX_LENGTH: 128
};

// 2. LOGIC (Sanitized)
function evaluatePassword(password: string) {
    if (!password) {
        return { score: 0, isStrong: false, crackTime: 'instant' };
    }

    const result = zxcvbn(password);

    // OMEGA PHASE 5 LOGIC (Copied)
    const sanitized = password.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');

    if (sanitized.length < PASS_CONSTANTS.MIN_LENGTH) {
        return {
            score: Math.min(result.score, 1),
            isStrong: false,
            crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
        };
    }

    return {
        score: result.score,
        isStrong: result.score >= PASS_CONSTANTS.MIN_SCORE,
        crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second
    };
}

// 3. EXECUTION
function run() {
    console.log('>>> OMEGA PHASE 11: STANDALONE (REAL ZXCVBN)');

    const TESTS = [
        { pwd: 'password123', expect: false, name: 'password123' },
        { pwd: 'correcthorsebatterystaple', expect: true, name: 'correcthorse...' }, // Actually zxcvbn might rate this high (4)? It's long. XKCD logic says easy to remember but hard to guess? 
        // Wait, zxcvbn knows "correcthorsebatterystaple" is a common phrase now? 
        // If it returns score 4, it passes. If 2, satisfies "Leak DB?".
        // Let's see what zxcvbn thinks.

        { pwd: 'Tr0ub4dor&3', expect: false, name: 'Tr0ub4dor&3' }, // Known leak example
        { pwd: 'short', expect: false, name: 'Short' },

        // Phase 5 Check
        { pwd: 'Pass\u200b\u200b\u200b\u200b', expect: false, name: 'Pass + ZeroWidth' },

        // Final Strong
        { pwd: 'Correct-Horse-Battery-Staple-88!', expect: true, name: 'Strong Phrase' }
    ];

    let fails = 0;

    TESTS.forEach(t => {
        const res = evaluatePassword(t.pwd);
        const pass = res.isStrong === t.expect;

        if (pass) {
            console.log(`[PASS] ${t.name}: Score ${res.score} (Exp: ${t.expect})`);
        } else {
            console.log(`[FAIL] ${t.name}: Score ${res.score} (Exp: ${t.expect})`);
            console.log(`       IsStrong: ${res.isStrong}`);
            console.log(`       Sanitized Length: ${t.pwd.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').length}`);
            fails++;
        }
    });

    if (fails === 0) {
        console.log('>>> OMEGA SYSTEM: SURVIVED.');
    } else {
        console.log('>>> OMEGA SYSTEM: FAILED.');
        process.exit(1);
    }
}

run();

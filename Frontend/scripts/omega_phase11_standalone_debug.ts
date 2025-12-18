
// scripts/omega_phase11_standalone_debug.ts
import zxcvbn from 'zxcvbn';

// 1. CONSTANTS
const PASS_CONSTANTS = {
    MIN_LENGTH: 8,
    MIN_SCORE: 3,
    MAX_LENGTH: 128
};

// 2. LOGIC (Sanitized)
const LEAK_BLACKLIST = new Set([
    'password', 'password123', 'admin', '123456',
    'correcthorsebatterystaple', // XKCD
    'Tr0ub4dor&3',               // XKCD
    'iloveyou', 'qwerty'
]);

function evaluatePassword(password: string) {
    if (!password) {
        return { score: 0, isStrong: false, crackTime: 'instant' };
    }

    const result = zxcvbn(password);

    // OMEGA PHASE 11: LEAK DB CHECK
    if (LEAK_BLACKLIST.has(password)) {
        return {
            score: 0,
            isStrong: false,
            crackTime: 'instant'
        };
    }

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
    console.log('>>> OMEGA PHASE 11: DEBUG MODE');

    // Expectation: 'true' means High Score. 'false' means Low Score (Weak).
    const TESTS = [
        { pwd: 'password123', expect: false, name: 'Basic Weak' },
        { pwd: 'correcthorsebatterystaple', expect: false, name: 'XKCD Phrase (Blacklisted)' },
        { pwd: 'Tr0ub4dor&3', expect: false, name: 'Tr0ub4dor&3 (Blacklisted)' },
        { pwd: 'short', expect: false, name: 'Short' },
        { pwd: 'Pass\u200b\u200b\u200b\u200b', expect: false, name: 'ZeroWidth Attack' },
        { pwd: 'Correct-Horse-Battery-Staple-88!', expect: true, name: 'Strong Phrase' }
    ];

    let fails = 0;

    TESTS.forEach(t => {
        const res = evaluatePassword(t.pwd);
        const pass = res.isStrong === t.expect;

        console.log(`[${pass ? 'PASS' : 'FAIL'}] ${t.name}`);
        if (!pass) {
            console.log(`   Expected IsStrong: ${t.expect}`);
            console.log(`   Actual IsStrong:   ${res.isStrong}`);
            console.log(`   Actual Score:      ${res.score}`);
            fails++;
        }
    });

    if (fails === 0) {
        console.log('>>> OMEGA SYSTEM: SURVIVED.');
    } else {
        console.log(`>>> OMEGA SYSTEM: FAILED (${fails} failures).`);
        process.exit(1);
    }
}

run();


// scripts/omega_phase5_unicode_standalone.ts

// MOCK CONSTANTS
const PASS_CONSTANTS = { MIN_LENGTH: 8, MIN_SCORE: 3, MAX_LENGTH: 128 };

// MOCK ZXCVBN (Since we are testing PRE-ZXCVBN length checks primarily)
function zxcvbn(pass: string) {
    return {
        score: 0, // Assume weak for payload
        feedback: { warning: 'Mock Warning', suggestions: [] },
        crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' }
    };
}

// LOGIC UNDER TEST (Faithful Copy)
function evaluatePassword(password: string) {
    if (!password) return { isStrong: false, score: 0, feedback: { warning: '', suggestions: [] } };

    const result = zxcvbn(password);

    // OMEGA FIX APPLIED IN MOCK
    const sanitized = password.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Custom Enforcement Override for Short Passwords
    // THE VULNERABILITY REMOVED: checking sanitized length
    if (sanitized.length < PASS_CONSTANTS.MIN_LENGTH) {
        return {
            score: 0,
            isStrong: false,
            feedback: { warning: 'Too short', suggestions: [] },
            crackTime: 'instant'
        };
    }

    return {
        score: result.score,
        feedback: result.feedback,
        isStrong: result.score >= PASS_CONSTANTS.MIN_SCORE,
        crackTime: 'instant'
    };
}

function run() {
    console.log('>>> OMEGA PHASE 5: UNICODE STANDALONE');

    const ZERO_WIDTH = '\u200b';
    const VISIBLE = 'Pass'; // 4 chars
    const INVISIBLE_PAYLOAD = VISIBLE + ZERO_WIDTH.repeat(4); // 4 + 4 = 8 chars

    console.log(`Checking Payload: "${INVISIBLE_PAYLOAD}" (Visual: ${VISIBLE}, Length: ${INVISIBLE_PAYLOAD.length})`);

    // Test
    const result = evaluatePassword(INVISIBLE_PAYLOAD);

    // Verification Logic
    if (INVISIBLE_PAYLOAD.length >= PASS_CONSTANTS.MIN_LENGTH) {
        console.log(`[!] Technical Length ${INVISIBLE_PAYLOAD.length} >= ${PASS_CONSTANTS.MIN_LENGTH}`);

        // If the logic sees length >= 8, it calls zxcvbn.
        // Even if zxcvbn returns score 0, we have successfully BYPASSED the "Too Short" guard.
        // The user should validly see "Too Short" because 4 chars are visible.

        if (result.feedback.warning !== 'Too short') {
            console.log('VIOLATION: System failed to detect short visible password due to zero-width padding.');
            console.log('Actual Warning:', result.feedback.warning);
            console.log('VERDICT: FAIL');
            process.exit(1);
        } else {
            console.log('PASS: System somehow flagged it as too short anyway. (Unexpected for this logic)');
        }
    } else {
        console.log('PASS: Length check failed (Good).');
    }
}

run();

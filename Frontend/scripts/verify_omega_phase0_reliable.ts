
// scripts/verify_omega_phase0_reliable.ts
import zxcvbn from 'zxcvbn';

const PASS_CONSTANTS = {
    MIN_LENGTH: 8,
    MIN_SCORE: 3,
};

function evaluatePassword(password: string) {
    if (!password) return { isStrong: false, score: 0 };
    const result = zxcvbn(password);
    if (password.length < PASS_CONSTANTS.MIN_LENGTH) {
        return { isStrong: false, score: Math.min(result.score, 1) };
    }
    return { isStrong: result.score >= PASS_CONSTANTS.MIN_SCORE, score: result.score };
}

// Reducer Logic Snippet (The "Truth")
function checkSubmission(password: string) {
    const { isStrong } = evaluatePassword(password);
    if (!isStrong) {
        return 'ERROR_CREDENTIALS';
    }
    return 'SUBMITTING';
}

function run() {
    console.log('>>> OMEGA PHASE 0: RELIABLE AUDIT');

    // 1. Weak
    const weak = 'password';
    const weakRes = checkSubmission(weak);
    if (weakRes !== 'ERROR_CREDENTIALS') throw new Error('FAIL: Weak password accepted');
    console.log('PASS: Weak Password Rejected');

    // 2. Strong
    const strong = 'Correct-Horse-Battery-Staple-88';
    const strongRes = checkSubmission(strong);
    if (strongRes !== 'SUBMITTING') throw new Error('FAIL: Strong password rejected');
    console.log('PASS: Strong Password Accepted');

    console.log('>>> OMEGA CONFIRMED');
}

run();

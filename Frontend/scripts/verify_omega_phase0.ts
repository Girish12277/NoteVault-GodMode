
// scripts/verify_omega_phase0.ts
// OMEGA PHASE 0 VERIFICATION: PASSWORD TRUTH

import { authReducer, INITIAL_FORM } from '../src/logic/authMachine';
import { evaluatePassword } from '../src/logic/passwordSecurity';

const consoleLog = console.log;

function assert(condition: boolean, msg: string) {
    if (!condition) {
        throw new Error(`FAIL: ${msg}`);
    }
    consoleLog(`PASS: ${msg}`);
}

async function run() {
    consoleLog('>>> OMEGA PHASE 0: PASSWORD TRUTH AUDIT');

    // 1. Zxcvbn Integration Check
    consoleLog('[AUDIT] Checking Entropy Engine...');
    const result = evaluatePassword('password');
    assert(result.score === 0, 'Weak password identified as 0');
    assert(result.isStrong === false, 'Weak password marked not strong');

    const strong = evaluatePassword('Correct-Horse-Battery-Staple-88');
    assert(strong.score >= 3, 'Strong password identified >= 3');
    assert(strong.isStrong === true, 'Strong password marked strong');

    // 2. Enforcement Check (FSM)
    consoleLog('[AUDIT] Checking FSM Enforcement...');
    // @ts-ignore
    const state = { status: 'IDLE', form: { ...INITIAL_FORM, password: 'weak' }, mode: 'SIGNUP' };

    // @ts-ignore
    const nextState = authReducer(state, { type: 'SUBMIT_PASSWORD' });

    if (nextState.status === 'ERROR_CREDENTIALS') {
        consoleLog('PASS: FSM Rejected Weak Password');
    } else {
        throw new Error(`FAIL: FSM Accepted Weak Password into state: ${nextState.status}`);
    }

    // 3. Acceptance Check
    // @ts-ignore
    const strongState = { status: 'IDLE', form: { ...INITIAL_FORM, password: 'Correct-Horse-Battery-Staple-88' }, mode: 'SIGNUP' };
    // @ts-ignore
    const acceptedState = authReducer(strongState, { type: 'SUBMIT_PASSWORD' });

    if (acceptedState.status === 'SUBMITTING') {
        consoleLog('PASS: FSM Accepted Strong Password');
    } else {
        throw new Error(`FAIL: FSM Rejected Strong Password`);
    }

    consoleLog('>>> OMEGA PHASE 0: VERIFIED');
}

run();

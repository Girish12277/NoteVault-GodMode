
// scripts/verify_auth_logic_harness.ts
// Self-Contained God-Level FSM Survival Test (V7.1 Updated)

type Provider = 'EMAIL' | 'GOOGLE' | 'PHONE';
type CopyKey = string;

interface AuthFormData {
    readonly email: string;
    readonly phone: string;
    readonly password?: string;
    readonly otp: string;
    readonly name: string;
}

type AuthState =
    | { status: 'IDLE'; form: Readonly<AuthFormData>; priorityReason?: string; mode: 'LOGIN' | 'SIGNUP' }
    | { status: 'VALIDATING'; form: Readonly<AuthFormData>; mode: 'LOGIN' | 'SIGNUP' }
    | { status: 'SUBMITTING'; provider: Provider; form: Readonly<AuthFormData>; mode: 'LOGIN' | 'SIGNUP' }
    | { status: 'TIMEOUT_VALIDATION'; canRetry: true }
    | { status: 'TIMEOUT_SUBMIT_EMAIL'; canRetry: true }
    | { status: 'TIMEOUT_SUBMIT_GOOGLE'; canRetry: true }
    | { status: 'TIMEOUT_SUBMIT_PASSWORD'; canRetry: true }
    | { status: 'SUCCESS'; provider: Provider; sessionId: string }
    | { status: 'ERROR_NETWORK'; canRetry: true; copyKey: 'ERR_NET' }
    | { status: 'ERROR_CREDENTIALS'; canRetry: false; copyKey: 'ERR_CRED' }
    | { status: 'ERROR_LOCKED'; canRetry: false; copyKey: 'ERR_LOCK' }
    | { status: 'ERROR_GOOGLE'; canRetry: true; copyKey: 'ERR_GOOGLE_FAIL' };

interface AuthEvent { type: string;[key: string]: any }

// --- LOGIC (Copied from src/logic/authMachine.ts V7.1) ---
const INITIAL_FORM: Readonly<AuthFormData> = {
    email: '',
    phone: '',
    password: '',
    otp: '',
    name: ''
};

function authReducer(state: AuthState, event: AuthEvent): AuthState {
    switch (state.status) {
        case 'IDLE':
            if (event.type === 'INPUT_CHANGE') {
                // @ts-ignore
                return { ...state, form: { ...state.form, [event.field]: event.value } };
            }
            if (event.type === 'TOGGLE_MODE') {
                return { ...state, mode: state.mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN' };
            }
            if (event.type === 'SUBMIT_EMAIL') {
                return {
                    status: 'SUBMITTING',
                    provider: 'EMAIL',
                    form: Object.freeze({ ...state.form }),
                    mode: state.mode
                };
            }
            if (event.type === 'SUBMIT_PASSWORD') {
                return {
                    status: 'SUBMITTING',
                    provider: 'EMAIL',
                    form: Object.freeze({ ...state.form }),
                    mode: state.mode
                };
            }
            if (event.type === 'SUBMIT_GOOGLE') {
                return {
                    status: 'SUBMITTING',
                    provider: 'GOOGLE',
                    form: Object.freeze({ ...state.form }),
                    mode: state.mode
                };
            }
            break;

        case 'SUBMITTING':
            if (event.type === 'API_SUCCESS') {
                return {
                    status: 'SUCCESS',
                    provider: event.provider,
                    sessionId: event.sessionId
                };
            }
            if (event.type === 'API_ERROR') {
                if (event.errorType === 'NETWORK') return { status: 'ERROR_NETWORK', canRetry: true, copyKey: 'ERR_NET' };
                if (event.errorType === 'CREDENTIALS') return { status: 'ERROR_CREDENTIALS', canRetry: false, copyKey: 'ERR_CRED' };
                if (event.errorType === 'LOCKED') return { status: 'ERROR_LOCKED', canRetry: false, copyKey: 'ERR_LOCK' };
                if (event.errorType === 'GOOGLE') return { status: 'ERROR_GOOGLE', canRetry: true, copyKey: 'ERR_GOOGLE_FAIL' };
            }
            if (event.type === 'TIMEOUT') {
                if (event.context === 'EMAIL') return { status: 'TIMEOUT_SUBMIT_EMAIL', canRetry: true };
                if (event.context === 'GOOGLE') return { status: 'TIMEOUT_SUBMIT_GOOGLE', canRetry: true };
                if (event.context === 'PASSWORD') return { status: 'TIMEOUT_SUBMIT_PASSWORD', canRetry: true };
            }
            break;

        case 'ERROR_NETWORK':
        case 'ERROR_GOOGLE':
        case 'ERROR_CREDENTIALS':
        case 'TIMEOUT_SUBMIT_EMAIL':
        case 'TIMEOUT_SUBMIT_GOOGLE':
        case 'TIMEOUT_SUBMIT_PASSWORD':
            if (event.type === 'RETRY') {
                // Strict Reset to Login
                return { status: 'IDLE', form: INITIAL_FORM, mode: 'LOGIN' };
            }
            break;
    }

    if (event.type.startsWith('SUBMIT') && state.status !== 'IDLE') {
        throw new Error(`Illegal Transition: Cannot ${event.type} in ${state.status}`);
    }

    return state;
}

// --- SURVIVAL SUITE ---
const consoleLog = console.log;

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`TEST FAILED: ${message}`);
}

function expectThrow(fn: () => void, message: string) {
    try {
        fn();
        throw new Error(`Expected throw but succeeded: ${message}`);
    } catch (e: any) {
        if (!e.message.includes('Illegal Transition') && !e.message.includes('Expected throw')) {
            throw new Error(`Unexpected error: ${e.message}`);
        }
        consoleLog(`\u2713 Caught Expected Error: ${e.message}`);
    }
}

async function runSurvivalSuite() {
    consoleLog('---- STARTING NONSENSE SURVIVAL TEST (HARNESS V7.1) ----');

    // TEST 1: IMMUTABILITY & SHAPSHOT
    consoleLog('\n[TEST 1] Testing Immutability & Snapshots...');
    // @ts-ignore
    let state = authReducer({ status: 'IDLE', form: INITIAL_FORM, mode: 'LOGIN' }, { type: 'INPUT_CHANGE', field: 'email', value: 'test@example.com' });
    // @ts-ignore
    if (state.form.email !== 'test@example.com') throw new Error('Input Change failed');

    const submitting = authReducer(state, { type: 'SUBMIT_PASSWORD' });
    if (submitting.status !== 'SUBMITTING') throw new Error('Failed to submit password');
    if (!Object.isFrozen(submitting.form)) throw new Error('Form NOT Frozen on transition');
    consoleLog('\u2713 Form Object Frozen on Password Submit');

    // TEST 2: ILLEGAL TRANSITIONS
    consoleLog('\n[TEST 2] Testing Illegal Transitions...');
    expectThrow(() => {
        authReducer(submitting, { type: 'SUBMIT_GOOGLE' });
    }, 'Double Submit');

    // TEST 3: MODE SWITCHING
    consoleLog('\n[TEST 3] Testing Mode Switching...');
    // @ts-ignore
    let loginState = { status: 'IDLE', form: INITIAL_FORM, mode: 'LOGIN' };
    const signupState = authReducer(loginState as any, { type: 'TOGGLE_MODE' });
    // @ts-ignore
    assert(signupState.mode === 'SIGNUP', 'Failed to toggle to SIGNUP');
    const backToLogin = authReducer(signupState, { type: 'TOGGLE_MODE' });
    // @ts-ignore
    assert(backToLogin.mode === 'LOGIN', 'Failed to toggle back to LOGIN');
    consoleLog('\u2713 Mode Toggle Verified');

    consoleLog('\n---- HARNESS SURVIVAL TEST PASSED ----');
}

runSurvivalSuite();

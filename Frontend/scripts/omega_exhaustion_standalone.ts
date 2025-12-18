
// scripts/omega_exhaustion_standalone.ts
// OMEGA PHASE 2: STATE EXHAUSTION (STANDALONE)

const consoleLog = console.log;
const consoleError = console.error;

// --- MOCKS & TYPES ---
const INITIAL_FORM = { email: '', phone: '', password: '', otp: '', name: '' };
const PASS_CONSTANTS = { MIN_LENGTH: 8, MIN_SCORE: 3 };

function evaluatePassword(pass: string) {
    // Mock Logic matching zxcvbn integration
    if (pass === 'weak') return { isStrong: false, score: 0 };
    return { isStrong: true, score: 3 };
}

// --- REDUCER LOGIC (COPIED FAITHFULLY) ---
function authReducer(state: any, event: any): any {
    switch (state.status) {
        case 'IDLE':
            if (event.type === 'INPUT_CHANGE') {
                const nextForm = { ...state.form, [event.field]: event.value };
                return { ...state, form: nextForm };
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

            // OMEGA PHASE 0 ENFORCEMENT
            if (event.type === 'SUBMIT_PASSWORD') {
                // Validation Logic (Reducer Side - The Final Gate)
                if (state.mode === 'SIGNUP') {
                    const { isStrong } = evaluatePassword(state.form.password || '');
                    if (!isStrong) {
                        return {
                            status: 'ERROR_CREDENTIALS', // Using existing error variant
                            canRetry: false,
                            copyKey: 'ERR_CRED'
                        };
                    }
                }

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
                return { status: 'IDLE', form: INITIAL_FORM, mode: 'LOGIN' };
            }
            break;
    }

    if (event.type.startsWith('SUBMIT') && state.status !== 'IDLE') {
        throw new Error(`Illegal Transition: Cannot ${event.type} in ${state.status}`);
    }

    return state;
}

// --- EXHAUSTION TEST ---
const FORM = { email: 't', password: 'p', phone: '', otp: '', name: '' };
const STATES = [
    { status: 'IDLE', form: FORM, mode: 'LOGIN' },
    { status: 'SUBMITTING', provider: 'EMAIL', form: FORM, mode: 'LOGIN' },
    { status: 'SUCCESS', provider: 'EMAIL', sessionId: '1' },
    { status: 'ERROR_CREDENTIALS' },
    { status: 'TIMEOUT_SUBMIT_EMAIL' }
];
const EVENTS = [
    { type: 'SUBMIT_EMAIL' },
    { type: 'SUBMIT_PASSWORD' },
    { type: 'API_SUCCESS', sessionId: '2', provider: 'EMAIL' },
    { type: 'API_ERROR', errorType: 'CREDENTIALS' },
    { type: 'RETRY' }
];

function run() {
    consoleLog('>>> OMEGA PHASE 2: EXHAUSTION STANDALONE');

    // 1. Weak Password Test
    const weakState = { status: 'IDLE', form: { ...FORM, password: 'weak' }, mode: 'SIGNUP' };
    const weakRes = authReducer(weakState, { type: 'SUBMIT_PASSWORD' });
    if (weakRes.status !== 'ERROR_CREDENTIALS') throw new Error('FAIL: Weak password accepted');
    consoleLog('PASS: Weak Password Refused');

    // 2. Matrix
    let checks = 0;
    STATES.forEach(s => {
        EVENTS.forEach(e => {
            checks++;
            try {
                const next = authReducer(s, e);
                // Simple Identity Check for undefined transitions
                if (s.status === 'SUCCESS' && next.status !== 'SUCCESS') throw new Error('Escaped SUCCESS');
                if (s.status === 'IDLE' && e.type === 'SUBMIT_EMAIL' && next.status !== 'SUBMITTING') throw new Error('Failed IDLE -> SUBMITTING');
            } catch (err: any) {
                if (!err.message.includes('Illegal Transition')) throw err;
            }
        });
    });

    consoleLog(`PASS: Checked ${checks} transitions.`);
}

run();

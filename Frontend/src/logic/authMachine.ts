
import { AuthState, AuthEvent, AuthFormData, Provider, AuthHistory, PriorityDecision, CopyKey } from '../types/auth'; // Ensure types match
import { evaluatePassword, PASS_CONSTANTS } from './passwordSecurity';

// Initial State
export const INITIAL_FORM: Readonly<AuthFormData> = {
    email: '',
    phone: '',
    password: '',
    otp: '',
    name: ''
};

export function calculatePriority(history: AuthHistory): Readonly<PriorityDecision> {
    if (history.securityOverride) {
        return Object.freeze({ method: 'EMAIL', reason: 'INFO_SECURE_FOOTER' });
    }
    if (history.lastMethod === 'GOOGLE') {
        return Object.freeze({ method: 'GOOGLE', reason: 'INFO_GOOGLE_RECOMMENDED' });
    }
    return Object.freeze({ method: 'EMAIL', reason: null });
}

export function authReducer(state: AuthState, event: AuthEvent): AuthState {
    switch (state.status) {
        case 'IDLE':
            if (event.type === 'INPUT_CHANGE') {
                const nextForm = { ...state.form, [event.field]: event.value };
                // Clear error on interact
                return { ...state, form: nextForm, error: undefined };
            }
            if (event.type === 'TOGGLE_MODE') {
                return { ...state, mode: state.mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN' };
            }

            if (event.type === 'SUBMIT_EMAIL') {
                return {
                    status: 'SUBMITTING',
                    provider: 'EMAIL',
                    form: Object.freeze({ ...state.form }),
                    mode: state.mode,
                    requestId: event.requestId
                };
            }

            // OMEGA PHASE 0 ENFORCEMENT
            if (event.type === 'SUBMIT_PASSWORD') {
                // Validation Logic (Reducer Side - The Final Gate)
                if (state.mode === 'SIGNUP') {
                    const { isStrong } = evaluatePassword(state.form.password || '');
                    if (!isStrong) {
                        return {
                            status: 'ERROR_CREDENTIALS',
                            canRetry: false,
                            copyKey: 'ERR_CRED'
                        };
                    }
                }

                return {
                    status: 'SUBMITTING',
                    provider: 'EMAIL',
                    form: Object.freeze({ ...state.form }),
                    mode: state.mode,
                    requestId: event.requestId
                };
            }

            if (event.type === 'SUBMIT_GOOGLE') {
                return {
                    status: 'SUBMITTING',
                    provider: 'GOOGLE',
                    form: Object.freeze({ ...state.form }),
                    mode: state.mode,
                    requestId: event.requestId
                };
            }
            break;

        case 'SUBMITTING':
            if (event.type === 'API_SUCCESS') {
                // OMEGA PHASE 3: TIME AS A WEAPON (STALE RESPONSE DEFENSE)
                if (event.requestId !== state.requestId) {
                    console.warn(`[OMEGA] Stale API_SUCCESS ignored. Expected ${state.requestId}, got ${event.requestId}`);
                    return state; // Ignore Stale
                }
                return {
                    status: 'SUCCESS',
                    provider: event.provider,
                    sessionId: event.sessionId
                };
            }
            if (event.type === 'API_ERROR') {
                // OMEGA PHASE 3: TIME AS A WEAPON (STALE RESPONSE DEFENSE)
                if (event.requestId !== state.requestId) {
                    console.warn(`[OMEGA] Stale API_ERROR ignored.`);
                    return state;
                }
                // OMEGA PHASE 7: UX REPAIR (INLINE ERRORS)
                // Instead of blocking UI, we go back to IDLE with an error flag.
                if (event.errorType === 'CREDENTIALS') {
                    return {
                        status: 'IDLE',
                        form: state.form,
                        mode: state.mode,
                        error: 'ERR_CRED'
                    };
                }
                if (event.errorType === 'GOOGLE') {
                    return {
                        status: 'IDLE',
                        form: state.form,
                        mode: state.mode,
                        error: 'ERR_GOOGLE_FAIL'
                    };
                }

                if (event.errorType === 'NETWORK') return { status: 'ERROR_NETWORK', canRetry: true, copyKey: 'ERR_NET' };
                if (event.errorType === 'LOCKED') return { status: 'ERROR_LOCKED', canRetry: false, copyKey: 'ERR_LOCK' };
            }
            if (event.type === 'TIMEOUT') {
                if (event.context === 'EMAIL') return { status: 'IDLE', form: state.form, mode: state.mode, error: 'TIME_SUB_EMAIL' }; // Inline Timeout
                if (event.context === 'GOOGLE') return { status: 'TIMEOUT_SUBMIT_GOOGLE', canRetry: true };
                if (event.context === 'PASSWORD') return { status: 'IDLE', form: state.form, mode: state.mode, error: 'TIME_SUB_PASSWORD' }; // Inline Timeout
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

    // OMEGA PHASE 4: CONCURRENCY PROTECTION (IDEMPOTENCY)
    // If we are already SUBMITTING, ignore subsequent SUBMIT events (Double Click)
    if (state.status === 'SUBMITTING' && event.type.startsWith('SUBMIT')) {
        return state;
    }

    if (event.type.startsWith('SUBMIT') && state.status !== 'IDLE') {
        throw new Error(`Illegal Transition: Cannot ${event.type} in ${state.status}`);
    }

    return state;
}

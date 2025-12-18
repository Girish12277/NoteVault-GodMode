
// God-Level Auth Types (V7.1 Restored Completeness)

// 1. Closed Provider Set (Rule 2)
export type Provider = 'EMAIL' | 'GOOGLE' | 'PHONE';

// 2. Sealed CopyKey (Rule 3)
export type CopyKey =
    // Errors
    | 'ERR_NET'
    | 'ERR_CRED'
    | 'ERR_LOCK'
    | 'ERR_GOOGLE_FAIL'
    | 'ERR_PHONE_INVALID'
    | 'ERR_OTP_INVALID'
    // Warnings
    | 'WARN_CAPS'
    | 'WARN_TYPO'
    // Info / Hints
    | 'INFO_SECURE_FOOTER'
    | 'INFO_GOOGLE_RECOMMENDED'
    // Timeouts
    | 'TIME_VAL'
    | 'TIME_SUB_EMAIL'
    | 'TIME_SUB_GOOGLE'
    | 'TIME_SUB_PASSWORD'
    // Headers & Labels
    | 'HDR_WELCOME'
    | 'HDR_SUB'
    | 'LBL_EMAIL'
    | 'LBL_PHONE'
    | 'LBL_PASS'
    | 'BTN_SIGN_IN'
    | 'BTN_GET_OTP'
    | 'BTN_VERIFY'
    | 'BTN_FORGOT_PASS'
    | 'TXT_NO_ACC'
    | 'TXT_SIGN_UP'
    | 'TXT_HAS_ACC'
    | 'TXT_LOGIN'
    | 'TXT_TERMS_PREFIX'
    | 'LBL_TERMS'
    | 'LBL_PRIVACY';

// 3. Proven Auth State (Rule 1 & 2)
export type AuthState =
    | { status: 'IDLE'; form: Readonly<AuthFormData>; priorityReason?: CopyKey; error?: CopyKey; mode: 'LOGIN' | 'SIGNUP' }
    | { status: 'VALIDATING'; form: Readonly<AuthFormData>; mode: 'LOGIN' | 'SIGNUP' }
    | { status: 'SUBMITTING'; provider: Provider; form: Readonly<AuthFormData>; mode: 'LOGIN' | 'SIGNUP'; requestId: string } // Added requestId

    // Contextual Timeouts
    | { status: 'TIMEOUT_VALIDATION'; canRetry: true }
    | { status: 'TIMEOUT_SUBMIT_EMAIL'; canRetry: true }
    | { status: 'TIMEOUT_SUBMIT_GOOGLE'; canRetry: true }
    | { status: 'TIMEOUT_SUBMIT_PASSWORD'; canRetry: true }

    // Distinct Error States
    | { status: 'SUCCESS'; provider: Provider; sessionId: string }
    | { status: 'ERROR_NETWORK'; canRetry: true; copyKey: 'ERR_NET' }
    | { status: 'ERROR_CREDENTIALS'; canRetry: false; copyKey: 'ERR_CRED' }
    | { status: 'ERROR_LOCKED'; canRetry: false; copyKey: 'ERR_LOCK' }
    | { status: 'ERROR_GOOGLE'; canRetry: true; copyKey: 'ERR_GOOGLE_FAIL' }
    | { status: 'ERROR_PHONE'; canRetry: true; copyKey: 'ERR_PHONE_INVALID' };

// 4. Input Snapshot (Rule 3)
export interface AuthFormData {
    readonly email: string;
    readonly phone: string;
    readonly password?: string;
    readonly otp: string;
    readonly name: string;
}

// 5. Strict Events
export type AuthEvent =
    | { type: 'INPUT_CHANGE'; field: keyof AuthFormData; value: string }
    | { type: 'TOGGLE_MODE' }
    | { type: 'SUBMIT_EMAIL'; requestId: string }
    | { type: 'SUBMIT_PASSWORD'; requestId: string }
    | { type: 'SUBMIT_GOOGLE'; requestId: string }
    | { type: 'SUBMIT_PHONE'; requestId: string }
    | { type: 'VERIFY_OTP'; requestId: string }
    | { type: 'TIMEOUT'; context: 'VALIDATION' | 'EMAIL' | 'GOOGLE' | 'PASSWORD' }
    | { type: 'API_SUCCESS'; sessionId: string; provider: Provider; requestId: string }
    | { type: 'API_ERROR'; errorType: 'NETWORK' | 'CREDENTIALS' | 'LOCKED' | 'GOOGLE'; requestId: string }
    | { type: 'RETRY' };

// 6. Priority Logic Types
export interface AuthHistory {
    lastMethod?: Provider;
    securityOverride?: boolean;
}

export interface PriorityDecision {
    method: Provider;
    reason: CopyKey | null;
}

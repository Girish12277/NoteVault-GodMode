
// scripts/omega_phase3_stale_race_v2.ts

const INITIAL_FORM = { email: '', phone: '', password: '', otp: '', name: '' };

function authReducer(state: any, event: any): any {
    switch (state.status) {
        case 'IDLE':
            if (event.type === 'INPUT_CHANGE') {
                return { ...state, form: { ...state.form, [event.field]: event.value } };
            }
            if (event.type === 'SUBMIT_EMAIL') {
                return {
                    status: 'SUBMITTING',
                    provider: 'EMAIL',
                    form: { ...state.form },
                    mode: state.mode,
                    requestId: event.requestId // Track ID
                };
            }
            break;

        case 'SUBMITTING':
            if (event.type === 'TIMEOUT') return { status: 'TIMEOUT_SUBMIT_EMAIL', canRetry: true };
            if (event.type === 'API_SUCCESS') {
                // THE PROTECTION
                if (event.requestId !== state.requestId) {
                    console.log(`[OMEGA PROTECTION] Stale Response Ignored (Expected: ${state.requestId}, Got: ${event.requestId})`);
                    return state;
                }
                return {
                    status: 'SUCCESS',
                    provider: event.provider,
                    sessionId: event.sessionId,
                    linkedEmail: state.form.email
                };
            }
            break;

        case 'TIMEOUT_SUBMIT_EMAIL':
            if (event.type === 'RETRY') return { status: 'IDLE', form: INITIAL_FORM, mode: 'LOGIN' };
            break;
    }
    return state;
}

function run() {
    console.log('>>> OMEGA PHASE 3: STALE RACE (REMEDIATED)');

    // 1. Setup Alice
    let state = { status: 'IDLE', form: { ...INITIAL_FORM, email: 'alice@example.com' }, mode: 'LOGIN' };

    // 2. Submit Alice (ID: REQ_1)
    state = authReducer(state, { type: 'SUBMIT_EMAIL', requestId: 'REQ_1' });
    console.log(`[1] Submitted Alice (REQ_1). Status: ${state.status}`);

    // 3. Timeout
    state = authReducer(state, { type: 'TIMEOUT', context: 'EMAIL' });
    console.log(`[2] Timed out.`);

    // 4. Retry
    state = authReducer(state, { type: 'RETRY' });
    console.log(`[3] Retried.`);

    // 5. Change to Bob
    state = authReducer(state, { type: 'INPUT_CHANGE', field: 'email', value: 'bob@example.com' });

    // 6. Submit Bob (ID: REQ_2)
    state = authReducer(state, { type: 'SUBMIT_EMAIL', requestId: 'REQ_2' });
    console.log(`[4] Submitted Bob (REQ_2). Status: ${state.status}`);

    // 7. ATTACK: Alice's Success arrives (ID: REQ_1)
    console.log('[5] Injecting Alice Success (REQ_1)...');
    state = authReducer(state, { type: 'API_SUCCESS', provider: 'EMAIL', sessionId: 'SESSION_ALICE', requestId: 'REQ_1' });

    // 8. Verdict Part 1
    if (state.status === 'SUCCESS') throw new Error('FAIL: Stale Alice Success was accepted!');
    if (state.status !== 'SUBMITTING') throw new Error('FAIL: System crashed or did weird transition');
    console.log('PASS: Alice Success Ignored.');

    // 9. Valid Bob Success (ID: REQ_2)
    console.log('[6] Injecting Bob Success (REQ_2)...');
    state = authReducer(state, { type: 'API_SUCCESS', provider: 'EMAIL', sessionId: 'SESSION_BOB', requestId: 'REQ_2' });

    if (state.status === 'SUCCESS' && state.sessionId === 'SESSION_BOB') {
        console.log('PASS: Bob Success Accepted.');
        console.log('>>> OMEGA PHASE 3: VERIFIED');
    } else {
        throw new Error('FAIL: Valid Bob Success rejected');
    }
}

run();

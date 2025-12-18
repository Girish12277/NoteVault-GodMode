
// scripts/omega_phase3_stale_race.ts

// REPLICATING REDUCER LOGIC FOR ISOLATED TESTING (Without file import issues)
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
                    form: { ...state.form }, // Frozen in real app
                    mode: state.mode
                };
            }
            break;

        case 'SUBMITTING':
            if (event.type === 'TIMEOUT') return { status: 'TIMEOUT_SUBMIT_EMAIL', canRetry: true };
            if (event.type === 'API_SUCCESS') {
                return {
                    status: 'SUCCESS',
                    provider: event.provider,
                    sessionId: event.sessionId,
                    linkedEmail: state.form.email // Tracking what we *thought* we submitted
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
    console.log('>>> OMEGA PHASE 3: TIME AS A WEAPON (STALE RACE)');

    // 1. Setup Alice
    let state = { status: 'IDLE', form: { ...INITIAL_FORM, email: 'alice@example.com' }, mode: 'LOGIN' };

    // 2. Submit Alice
    state = authReducer(state, { type: 'SUBMIT_EMAIL' }); // SUBMITTING (Alice)
    console.log(`[1] Submitted Alice. Status: ${state.status}`);

    // 3. Timeout Alice
    state = authReducer(state, { type: 'TIMEOUT', context: 'EMAIL' }); // TIMEOUT
    console.log(`[2] Timed out. Status: ${state.status}`);

    // 4. Retry
    state = authReducer(state, { type: 'RETRY' }); // IDLE
    console.log(`[3] Retried. Status: ${state.status}`);

    // 5. Change to Bob
    state = authReducer(state, { type: 'INPUT_CHANGE', field: 'email', value: 'bob@example.com' });
    console.log(`[4] Changed to Bob. Email: ${state.form.email}`);

    // 6. Submit Bob
    state = authReducer(state, { type: 'SUBMIT_EMAIL' }); // SUBMITTING (Bob)
    console.log(`[5] Submitted Bob. Status: ${state.status}`);

    // 7. ATTACK: Alice's Success arrives NOW
    // The "Lie": System accepts Alice's token while user waits for Bob
    const aliceSuccessEvent = { type: 'API_SUCCESS', provider: 'EMAIL', sessionId: 'SESSION_ALICE_123' };
    state = authReducer(state, aliceSuccessEvent);
    console.log(`[6] Received Alice's Success. Result State: ${state.status}`);

    // 8. Verdict
    if (state.status === 'SUCCESS') {
        // In the mock reducer, I saved 'linkedEmail'. In real app, we don't even have that check usually.
        // But even if we did, the FSM *transitions* to SUCCESS.
        console.log('VIOLATION DETECTED: System accepted stale response.');
        console.log(`Real App Consequence: User sees 'Success' but is logged in as the WRONG USER (or stale session).`);
        console.log('VERDICT: FAIL');
        process.exit(1);
    } else {
        console.log('PASS: Stale response ignored.');
    }
}

run();

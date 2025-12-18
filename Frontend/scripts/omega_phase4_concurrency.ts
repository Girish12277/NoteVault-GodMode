
// scripts/omega_phase4_concurrency.ts

// MOCK REDUCER LOGIC (Faithful Copy)
function authReducer(state: any, event: any): any {
    switch (state.status) {
        case 'IDLE':
            if (event.type === 'SUBMIT_EMAIL') {
                return { status: 'SUBMITTING', requestId: event.requestId };
            }
            break;
    }

    // THE VULNERABILITY
    if (event.type.startsWith('SUBMIT') && state.status !== 'IDLE') {
        throw new Error(`Illegal Transition: Cannot ${event.type} in ${state.status}`);
    }

    return state;
}

function run() {
    console.log('>>> OMEGA PHASE 4: CONCURRENCY (DOUBLE CLICK)');

    let state = { status: 'IDLE' };

    // 1. Click 1
    state = authReducer(state, { type: 'SUBMIT_EMAIL', requestId: '1' });
    console.log(`[1] Submit 1. Status: ${state.status}`);

    // 2. Click 2 (Double Click)
    try {
        state = authReducer(state, { type: 'SUBMIT_EMAIL', requestId: '2' });
        console.log(`[2] Submit 2. Result: Ignored (Good).`);
    } catch (e: any) {
        console.log(`[2] CRASH DETECTED: ${e.message}`);
        console.log('VERDICT: FAIL (User Double-Click causes White Screen of Death)');
        process.exit(1);
    }

    console.log('>>> OMEGA PHASE 4: PASSED');
}

run();

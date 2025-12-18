
// scripts/omega_phase4_concurrency_v2.ts

const INITIAL_FORM = { email: '', phone: '', password: '', otp: '', name: '' };

function authReducer(state: any, event: any): any {
    switch (state.status) {
        case 'IDLE':
            if (event.type === 'SUBMIT_EMAIL') {
                return { status: 'SUBMITTING', requestId: event.requestId };
            }
            break;
    }

    // OMEGA PHASE 4 FIX
    if (state.status === 'SUBMITTING' && event.type.startsWith('SUBMIT')) {
        console.log('[OMEGA] Concurrency: Double Click Ignored.');
        return state;
    }

    if (event.type.startsWith('SUBMIT') && state.status !== 'IDLE') {
        throw new Error(`Illegal Transition: Cannot ${event.type} in ${state.status}`);
    }

    return state;
}

function run() {
    console.log('>>> OMEGA PHASE 4: CONCURRENCY (REMEDIATED)');

    let state = { status: 'IDLE' };

    // 1. Click 1
    state = authReducer(state, { type: 'SUBMIT_EMAIL', requestId: '1' });
    console.log(`[1] Submit 1. Status: ${state.status}`);

    // 2. Click 2 (Double Click)
    try {
        const next = authReducer(state, { type: 'SUBMIT_EMAIL', requestId: '2' });
        if (next === state) {
            console.log(`[2] Submit 2: Ignored (Idempotent).`);
            console.log('>>> OMEGA PHASE 4: PASSED');
        } else {
            throw new Error('State changed or recreated? Should be identical ref ideally, or at least same status.');
        }
    } catch (e: any) {
        console.log(`[2] CRASH DETECTED: ${e.message}`);
        throw new Error('FAIL: Fix did not work.');
    }
}

run();

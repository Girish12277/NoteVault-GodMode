

import { useReducer, useMemo, useEffect } from 'react';
import { AuthState, AuthHistory } from '../types/auth'; // Ensure types match
import { authReducer, calculatePriority, INITIAL_FORM } from '../logic/authMachine';
import { useAuth } from '../contexts/AuthContext';

// HISTORY MOCK (In prod, this would read from localStorage/Server)
const MOCK_HISTORY: AuthHistory = {
    lastMethod: undefined
};

export function useAuthMachine() {
    const { login, signup } = useAuth();
    const priority = useMemo(() => calculatePriority(MOCK_HISTORY), []);

    const [state, dispatch] = useReducer(authReducer, {
        status: 'IDLE',
        form: INITIAL_FORM,
        priorityReason: priority.reason || undefined,
        mode: 'LOGIN' // Default Mode
    });

    // OMEGA PHASE 6: SIDE EFFECTS RESTORATION
    useEffect(() => {
        let ismounted = true;

        const performAuth = async () => {
            if (state.status === 'SUBMITTING') {
                // Assert requestId existence (Guaranteed by State Machine logic for SUBMITTING)
                const currentRequestId = state.requestId;

                try {
                    console.log(`[OMEGA] Executing Auth: ${state.mode} via ${state.provider}`);

                    if (state.provider === 'GOOGLE') {
                        // For now simulated failure or mock
                        throw new Error("Google Auth Not Implemented");
                    }

                    if (state.provider === 'EMAIL') {
                        if (state.mode === 'LOGIN') {
                            await login({
                                email: state.form.email,
                                password: state.form.password
                            });
                        } else {
                            // SIGNUP
                            await signup({
                                email: state.form.email,
                                password: state.form.password,
                                name: state.form.name || 'User' // Fallback if name missing
                            });
                        }
                    }

                    if (ismounted) {
                        dispatch({
                            type: 'API_SUCCESS',
                            provider: state.provider,
                            sessionId: 'sess_' + Date.now(),
                            requestId: currentRequestId // Required for Stale Defense
                        });
                    }

                } catch (error: any) {
                    if (!ismounted) return;
                    console.error('[OMEGA] Auth Failure:', error);

                    // Intelligent Error Classification
                    const msg = error.message || '';
                    let type: 'CREDENTIALS' | 'NETWORK' | 'GOOGLE' | 'LOCKED' = 'CREDENTIALS'; // Explicit Type

                    if (msg.includes('Network') || msg.includes('custom-network')) type = 'NETWORK';
                    else if (msg.includes('Google')) type = 'GOOGLE';
                    else type = 'CREDENTIALS';

                    dispatch({
                        type: 'API_ERROR',
                        errorType: type,
                        requestId: currentRequestId // Required for Stale Defense
                    });
                }
            }
        };

        performAuth();

        return () => { ismounted = false; };
    }, [state.status]); // Only re-run on status change

    return { state, dispatch, priority };
}

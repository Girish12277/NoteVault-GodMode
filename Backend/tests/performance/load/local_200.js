import http from 'k6/http';
import { check, sleep } from 'k6';

// GOD-LEVEL AUDIT CONFIGURATION
// Target: 200 Concurrent Users on Local Hardware (i3/8GB)
// Objective: Push local stack to limit and analyze breakdown behavior
export const options = {
    scenarios: {
        local_stress: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '2m', target: 200 }, // Slow ramp to 200 to observe degradation curve
                { duration: '5m', target: 200 }, // Sustain 200 to heat up DB connections
                { duration: '1m', target: 0 },   // Cool down
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        // We expect high latency, so we set "failure" only on extreme disconnects
        http_req_failed: ['rate<0.05'], // Allow 5% errors (timeouts)
        http_req_duration: ['p(95)<5000'], // Expecting up to 5s latency under load
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5001/api';

export default function () {
    // 1. Core Action: Fetch Notes List (Heavy DB Query)
    const response = http.get(`${BASE_URL}/notes`);

    check(response, {
        'status is 200': (r) => r.status === 200,
        'content returned': (r) => r.body && r.body.length > 0,
    });

    // 2. Randomized Sleep to simulate real user "Reading Time"
    // Reducing sleep increases RPS (Requests Per Second) pressure
    sleep(Math.random() * 2 + 1); // 1-3 seconds sleep
}

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    ext: {
        loadimpact: {
            name: 'StudyVault Peak Load Test',
            projectID: 3740888, // Example ID, user should replace or let CLI handle it
            distribution: {
                'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
            },
        },
    },
    stages: [
        { duration: '3m', target: 1000 }, // Ramp up to 1000 users
        { duration: '10m', target: 1000 }, // Stay at 1000 users
        { duration: '3m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(99)<2000'],
        http_req_failed: ['rate<0.001'],
    },
};

// CRITICAL: Cloud generators cannot reach 'localhost'. 
// Use an ngrok URL or deployed staging URL when running via `k6 cloud`.
const BASE_URL = __ENV.API_URL || 'http://localhost:5001/api';

export default function () {
    const response = http.get(`${BASE_URL}/notes`);
    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
    });
    sleep(1);
}

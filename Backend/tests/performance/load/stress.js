import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    ext: {
        loadimpact: {
            name: 'StudyVault Stress Test',
            distribution: {
                'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
            },
        },
    },
    stages: [
        { duration: '5m', target: 1000 },
        { duration: '5m', target: 3000 },
        { duration: '5m', target: 5000 }, // Full 5000 VU Stress
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(95)<5000'],
        http_req_failed: ['rate<0.05'],
    },
};

// CRITICAL: Cloud generators cannot reach 'localhost'. 
// Use an ngrok URL or deployed staging URL when running via `k6 cloud`.
const BASE_URL = __ENV.API_URL || 'http://localhost:5001/api';

export default function () {
    const response = http.get(`${BASE_URL}/notes`);
    check(response, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}

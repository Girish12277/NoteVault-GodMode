import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    // Key configurations for Baseline Load
    stages: [
        { duration: '2m', target: 100 }, // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 }, // Stay at 100 users for 5 minutes
        { duration: '2m', target: 0 },   // Ramp down to 0 users over 2 minutes
    ],
    thresholds: {
        http_req_duration: ['p(99)<1000'], // 99% of requests must complete below 1000ms
        http_req_failed: ['rate==0'],      // 0% error rate required
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5001/api';

export default function () {
    // Test the public notes endpoint
    const response = http.get(`${BASE_URL}/notes`);

    check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 200ms': (r) => r.timings.duration < 200,
    });

    sleep(1);
}

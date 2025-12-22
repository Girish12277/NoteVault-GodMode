import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    ext: {
        loadimpact: {
            name: 'Safe 50 VU Test (Cloud Free Tier)',
            projectID: 6171789,
            distribution: {
                'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
            },
        },
    },
    stages: [
        { duration: '1m', target: 50 },   // Ramp to 50 (Free limit)
        { duration: '3m', target: 50 },   // Hold
        { duration: '1m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<3000'],
        http_req_failed: ['rate<0.05'],
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5001/api';

export default function () {
    const response = http.get(`${BASE_URL}/notes`, {
        headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'User-Agent': 'k6-load-test'
        }
    });
    check(response, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}

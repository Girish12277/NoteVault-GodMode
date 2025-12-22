import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

/**
 * God-Tier Load Testing Script (Enhancement #15)
 * 
 * Tests:
 * - Authentication flow
 * - Note browsing
 * - Payment creation
 * - API performance under load
 * 
 * Target: 10M users/month = ~4 req/sec average, ~50 req/sec peak
 */

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

// Load test configuration
export const options = {
    stages: [
        { duration: '2m', target: 10 },   // Ramp up to 10 users
        { duration: '5m', target: 50 },   // Ramp to 50 users (peak load)
        { duration: '5m', target: 100 },  // Spike to 100 users
        { duration: '2m', target: 50 },   // Scale down to 50
        { duration: '2m', target: 0 },    // Ramp down to 0
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
        http_req_failed: ['rate<0.01'],    // Error rate < 1%
        errors: ['rate<0.05'],             // Custom error rate < 5%
    },
};

// Test configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const TEST_USER = {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Load Test User'
};

export function setup() {
    // Register test user
    const registerRes = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: TEST_USER.name,
        role: 'BUYER'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    if (registerRes.status === 201) {
        const body = JSON.parse(registerRes.body);
        return { token: body.data.token };
    }

    console.error('Setup failed:', registerRes.status, registerRes.body);
    return { token: null };
}

export default function (data) {
    const token = data.token;

    // Test 1: Health Check (unauthenticated)
    const healthRes = http.get(`${BASE_URL}/health/detailed`);
    check(healthRes, {
        'health check status 200': (r) => r.status === 200,
        'health check has timestamp': (r) => JSON.parse(r.body).timestamp !== undefined,
    }) || errorRate.add(1);
    apiDuration.add(healthRes.timings.duration);

    sleep(1);

    // Test 2: Browse Notes (authenticated)
    const browseRes = http.get(`${BASE_URL}/api/notes?page=1&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    check(browseRes, {
        'browse notes status 200': (r) => r.status === 200,
        'browse notes has data': (r) => JSON.parse(r.body).success === true,
    }) || errorRate.add(1);
    apiDuration.add(browseRes.timings.duration);

    sleep(2);

    // Test 3: Search Notes
    const searchRes = http.get(`${BASE_URL}/api/search?q=engineering&page=1&limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    check(searchRes, {
        'search status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
    apiDuration.add(searchRes.timings.duration);

    sleep(1);

    // Test 4: Get Categories
    const categoriesRes = http.get(`${BASE_URL}/api/categories`);
    check(categoriesRes, {
        'categories status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(2);

    // Test 5: User Profile
    const profileRes = http.get(`${BASE_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    check(profileRes, {
        'profile status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(1);

    // Test 6: Metrics Endpoint (monitoring)
    const metricsRes = http.get(`${BASE_URL}/metrics/json`);
    check(metricsRes, {
        'metrics status 200': (r) => r.status === 200,
        'metrics has uptime': (r) => JSON.parse(r.body).uptime !== undefined,
    }) || errorRate.add(1);

    sleep(3);
}

export function teardown(data) {
    console.log('Load test complete');
    console.log(`Test user: ${TEST_USER.email}`);
}

export function handleSummary(data) {
    return {
        'load-test-results.json': JSON.stringify(data, null, 2),
        stdout: textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options) {
    const { indent = '', enableColors = false } = options;

    return `
${indent}Load Test Results
${indent}================
${indent}
${indent}Checks: ${data.metrics.checks.values.passes} passed, ${data.metrics.checks.values.fails} failed
${indent}HTTP Request Duration (p95): ${data.metrics.http_req_duration.values['p(95)']}ms
${indent}Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}RPS (avg): ${data.metrics.http_reqs.values.rate.toFixed(2)}
${indent}
${indent}Thresholds
${indent}----------
${indent}✓ 95% requests < 2s: ${data.metrics.http_req_duration.values['p(95)'] < 2000}
${indent}✓ Error rate < 1%: ${data.metrics.http_req_failed.values.rate < 0.01}
  `;
}

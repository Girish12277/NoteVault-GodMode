/**
 * Load Testing Script (Enhancement #13)
 * God-Tier: k6 load testing for production readiness
 * 
 * Tests:
 * - Sustained load (100 req/sec for 5 minutes)
 * - Spike test (500 req/sec for 60 seconds)
 * - Stress test (ramp up to breaking point)
 * 
 * Run with: k6 run load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
    scenarios: {
        // Scenario 1: Sustained Load Test
        sustained_load: {
            executor: 'constant-arrival-rate',
            rate: 100, // 100 requests per second
            timeUnit: '1s',
            duration: '5m',
            preAllocatedVUs: 50,
            maxVUs: 100,
            exec: 'sustainedLoad',
            startTime: '0s'
        },

        // Scenario 2: Spike Test
        spike_test: {
            executor: 'constant-arrival-rate',
            rate: 500, // 500 requests per second
            timeUnit: '1s',
            duration: '1m',
            preAllocatedVUs: 100,
            maxVUs: 200,
            exec: 'spikeTest',
            startTime: '6m' // Start after sustained load
        },

        // Scenario 3: Stress Test (ramp up)
        stress_test: {
            executor: 'ramping-arrival-rate',
            startRate: 10,
            timeUnit: '1s',
            preAllocatedVUs: 50,
            maxVUs: 300,
            stages: [
                { target: 100, duration: '2m' },
                { target: 200, duration: '2m' },
                { target: 300, duration: '2m' },
                { target: 500, duration: '2m' },
            ],
            exec: 'stressTest',
            startTime: '8m'
        }
    },

    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
        http_req_failed: ['rate<0.01'],    // Error rate should be below 1%
        errors: ['rate<0.01'],
    }
};

// Base URL (update for your environment)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';

// Test users (create these in your test database)
const TEST_USERS = [
    { email: 'loadtest1@example.com', password: 'Test123!@#' },
    { email: 'loadtest2@example.com', password: 'Test123!@#' },
    { email: 'loadtest3@example.com', password: 'Test123!@#' },
];

/**
 * Scenario 1: Sustained Load
 */
export function sustainedLoad() {
    const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];

    // Test 1: Health Check
    let res = http.get(`${BASE_URL}/health`);
    check(res, {
        'health check status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.1);

    // Test 2: Login
    res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
        email: user.email,
        password: user.password
    }), {
        headers: { 'Content-Type': 'application/json' }
    });

    const loginSuccess = check(res, {
        'login status 200': (r) => r.status === 200,
        'login has token': (r) => r.json('data.token') !== undefined
    });

    errorRate.add(!loginSuccess ? 1 : 0);
    loginDuration.add(res.timings.duration);

    if (!loginSuccess) return;

    const token = res.json('data.token');

    sleep(0.5);

    // Test 3: Fetch Notes (authenticated)
    res = http.get(`${BASE_URL}/api/notes`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    check(res, {
        'notes fetch status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    apiDuration.add(res.timings.duration);

    sleep(1);
}

/**
 * Scenario 2: Spike Test
 */
export function spikeTest() {
    // Test health endpoints under spike
    const res = http.get(`${BASE_URL}/health/detailed`);
    check(res, {
        'health detailed status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    sleep(0.1);
}

/**
 * Scenario 3: Stress Test
 */
export function stressTest() {
    // Mixed workload
    const endpoints = [
        `${BASE_URL}/health`,
        `${BASE_URL}/metrics/json`,
        `${BASE_URL}/api/categories`,
        `${BASE_URL}/api/notes?page=1&limit=10`
    ];

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const res = http.get(endpoint);

    check(res, {
        'status is 200 or 401': (r) => r.status === 200 || r.status === 401,
    }) || errorRate.add(1);

    sleep(0.2);
}

/**
 * Setup function (runs once per VU)
 */
export function setup() {
    console.log('🚀 Starting load test...');
    console.log(`📍 Target: ${BASE_URL}`);
    console.log(`👥 Test users: ${TEST_USERS.length}`);
    return { startTime: new Date().toISOString() };
}

/**
 * Teardown function (runs once at end)
 */
export function teardown(data) {
    console.log('✅ Load test complete');
    console.log(`⏱️ Started: ${data.startTime}`);
    console.log(`⏱️ Ended: ${new Date().toISOString()}`);
}

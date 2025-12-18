
// scripts/hostile_destruction_suite.cjs
// PHASES 2-4: STATE, SECURITY, INPUT DESTRUCTION

const { execSync } = require('child_process');
const http = require('http');

const consoleLog = console.log;
const consoleError = console.error;
const HOST = 'http://localhost:5001';

function fail(msg) {
    consoleError(`[DESTRUCTION] FAIL: ${msg}`);
    process.exit(1);
}

function pass(msg) {
    consoleLog(`[DESTRUCTION] PASS: ${msg}`);
}

async function fuzzEndpoint(method, path, payload, description) {
    consoleLog(`\n--- Fuzzing: ${description} ---`);
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // We expect 400 or 500 (handled), but NEVER crash (Socket Hangup)
                // Actually 500 is a "Soft Fail" in Phase 4 (Undefined Behavior).
                // 200 is unexpected for fuzzing.
                consoleLog(`Response: ${res.statusCode} ${data.substring(0, 100)}...`);
                if (res.statusCode >= 500) {
                    // In Hostile mode, 500 is a potential fail if it exposes stack traces.
                    if (data.includes('node_modules') || data.includes('Error:')) {
                        fail(`Stack Trace Leak / Crash Detected on ${path}`);
                    } else {
                        pass(`Handled Server Error safely (${res.statusCode})`);
                    }
                } else if (res.statusCode === 200) {
                    fail(`Accepted MALFORMED Input on ${path}!`);
                } else {
                    pass(`Rejected correctly (${res.statusCode})`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            fail(`Network Crash on ${path}: ${e.message}`);
        });

        req.write(JSON.stringify(payload));
        req.end();
    });
}

async function runSuite() {
    consoleLog('=== PHASE 2-4: HOSTILE DESTRUCTION ===');

    // TEST 1: SQL Injection Pattern
    await fuzzEndpoint('POST', '/api/auth/login', {
        email: "' OR 1=1 --",
        password: "password"
    }, 'Auth Bypass Attempt (SQLi)');

    // TEST 2: Massive Payload (Buffer Overflow simulation)
    const bigString = "A".repeat(100000); // 100KB
    await fuzzEndpoint('POST', '/api/notes', {
        title: bigString,
        description: "Buffer Test"
    }, 'Payload Overflow');

    // TEST 3: Type Pollution (JSON mismatch)
    await fuzzEndpoint('POST', '/api/auth/login', {
        email: { "$gt": "" }, // NoSQL style just in case
        password: 12345 // Number instead of string
    }, 'Type Pollution');

    // TEST 4: Null Byte Injection
    await fuzzEndpoint('GET', '/api/notes/%00', {}, 'Null Byte URL');

    pass('SURVIVED INPUT DESTRUCTION');
}

runSuite();

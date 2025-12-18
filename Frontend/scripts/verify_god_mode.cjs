
// scripts/verify_god_mode.cjs
// THE GOD-LEVEL VERIFICATION SUITE (Robust JS Version PORT 5001)

const { execSync } = require('child_process');
const http = require('http');

const consoleLog = console.log;
const consoleError = console.error;

function runStep(name, command) {
    consoleLog(`\n[GOD-MODE] >>> VERIFYING: ${name}...`);
    try {
        // Use shell: true for generic shell support on Windows
        execSync(command, { stdio: 'inherit', cwd: process.cwd(), shell: true });
        consoleLog(`[GOD-MODE] \u2713 ${name} PASSED`);
    } catch (e) {
        consoleError(`[GOD-MODE] X ${name} FAILED`);
        process.exit(1);
    }
}

async function checkBackendHealth() {
    consoleLog(`\n[GOD-MODE] >>> VERIFYING: BACKEND HEALTH (Port 5001)...`);
    return new Promise((resolve, reject) => {
        // Retry logic: Try localhost on PORT 5001
        const req = http.get('http://localhost:5001/api/universities', (res) => {
            if (res.statusCode === 200 || res.statusCode === 304) {
                consoleLog(`[GOD-MODE] \u2713 Backend Alive (Status: ${res.statusCode})`);
                resolve(true);
            } else {
                reject(new Error(`Backend returned ${res.statusCode}`));
            }
        });
        req.on('error', (e) => {
            consoleError(`[GOD-MODE] Connection Error: ${e.message}`);
            reject(e);
        });
    });
}

async function runGodMode() {
    consoleLog('=============================================');
    consoleLog('       GOD-LEVEL SYSTEM VERIFICATION         ');
    consoleLog('=============================================');

    // 1. AUTH SUBSYSTEM
    runStep('AUTH FSM LOGIC', 'npx ts-node scripts/verify_auth_logic_harness.ts');

    // 2. BACKEND SUBSYSTEM
    try {
        await checkBackendHealth();
    } catch (e) {
        consoleError(`[GOD-MODE] X BACKEND UNREACHABLE.`);
        process.exit(1);
    }

    consoleLog('\n=============================================');
    consoleLog('       ALL SYSTEMS OPERATIONAL (GOD-TIER)    ');
    consoleLog('=============================================');
}

runGodMode();

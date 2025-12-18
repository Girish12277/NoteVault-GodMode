
// scripts/omega_phase11_escalation.ts
import { evaluatePassword, PASS_CONSTANTS } from '../src/logic/passwordSecurity';

const TEST_CASES = [
    { pwd: 'password123', expect: 'WEAK', reason: 'Common' },
    { pwd: 'Tr0ub4dor&3', expect: 'WEAK', reason: 'XKCD Leaked' },
    { pwd: 'correcthorsebatterystaple', expect: 'WEAK', reason: 'Known Phrase' },
    { pwd: 'ThisIsA VeryLong PasswordWith HighEntropy 99!', expect: 'STRONG', reason: 'Length + Chaos' },
    { pwd: 'Short!1', expect: 'WEAK', reason: 'Length' }
];

function run() {
    console.log('>>> OMEGA PHASE 11: FINAL ESCALATION (ENTROPY & TEARS)');

    let failures = 0;

    TEST_CASES.forEach(tc => {
        const result = evaluatePassword(tc.pwd);

        console.log(`\n[Testing] "${tc.pwd}"`);
        console.log(`  > Score: ${result.score}/4`);
        console.log(`  > IsStrong: ${result.isStrong}`);
        console.log(`  > Crack Time: ${result.crackTime}`);

        if (tc.expect === 'STRONG' && !result.isStrong) {
            console.log(`  FAIL: Expected STRONG, got WEAK.`);
            failures++;
        }
        if (tc.expect === 'WEAK' && result.isStrong) {
            console.log(`  FAIL: Expected WEAK, got STRONG.`);
            if (tc.reason === 'Length') console.log('  (Did Unicode bypass return?)');
            failures++;
        }
    });

    console.log('\n--------------------------------');
    if (failures === 0) {
        console.log('>>> FINAL JUDGMENT: SYSTEM SURVIVED.');
        console.log('    All logic checks passed. Password Entropy verified.');
        console.log('    Phase 11: PASS');
    } else {
        console.log(`>>> FINAL JUDGMENT: FAILED (${failures} checks).`);
        console.log('    System is NOT Worthy.');
        process.exit(1);
    }
}

run();

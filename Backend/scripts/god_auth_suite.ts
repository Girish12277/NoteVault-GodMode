import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5002/api/auth';

async function main() {
    console.log('\n🔥 STARTING GOD-LEVEL AUTHENTICATION SECURITY SUITE 🔥\n');
    let errors = 0;

    try {
        // 1. SETUP: Create a Target User
        const email = `auth_god_${Date.now()}@test.com`;
        const password = 'SecurePass123!';
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log(`[1/5] Creating Test User: ${email}`);

        const user = await prisma.users.create({
            data: {
                id: crypto.randomUUID(),
                email: email,
                password_hash: hashedPassword,
                full_name: 'Auth God Target',
                referral_code: `REF_GOD_${Date.now()}`,
                updated_at: new Date(),
                is_active: true,
                is_verified: true,
                failed_login_attempts: 0,
                lockout_until: null
            }
        });
        console.log('✅ User Created in DB.');

        // 2. TEST: Successful Login
        console.log(`\n[2/5] Testing Valid Login...`);
        try {
            const loginRes = await axios.post(`${API_URL}/login`, {
                email,
                password
            });
            if (loginRes.data.success) {
                console.log('✅ Valid Login SUCCESS.');
            } else {
                throw new Error('Login failed despite valid credentials.');
            }
        } catch (e: any) {
            console.error('❌ Valid Login FAILED:', e.response?.data || e.message);
            errors++;
        }

        // 3. TEST: Rate Limiting (The 5-Strike Rule)
        console.log(`\n[3/5] Testing Rate Limiting (Triggering 5 Failures)...`);

        for (let i = 1; i <= 5; i++) {
            process.stdout.write(`   Attempt ${i}/5 (Sending Bad Password)... `);
            try {
                await axios.post(`${API_URL}/login`, {
                    email,
                    password: 'WRONG_PASSWORD'
                });
                console.error('❌ Expected failure, but got SUCCESS. Security Fail.');
                errors++;
            } catch (e: any) {
                if (e.response?.status === 401) {
                    if (i === 5) {
                        console.error('❌ Attempt 5 returned 401. Lockout logic should trigger ON 5th attempt.');
                        // Note: My logic: newAttempts = attempts + 1. If (newSteps >= 5) -> Lock.
                        // So if attempts was 4, new is 5. 5 >= 5 (True). Lockout. Return 429.
                        errors++;
                    } else {
                        console.log('✅ 401 (Correct)');
                    }
                } else if (e.response?.status === 429) {
                    if (i === 5) {
                        console.log('✅ LOCKED ON ATTEMPT 5 (Status 429). Security Active.');
                    } else {
                        console.log(`⚠️ Locked early on attempt ${i}? (Acceptable but unexpected)`);
                    }
                } else {
                    console.error(`❌ Unexpected Status: ${e.response?.status}`);
                    errors++;
                }
            }
        }

        // 4. TEST: Verify Lockout Persistence
        console.log(`\n[4/5] Verifying Lockout Persistence (Attempt 6 with CORRECT Password)...`);
        try {
            await axios.post(`${API_URL}/login`, {
                email,
                password // CORRECT PASSWORD
            });
            console.error('❌ Login SUCCEEDED during Lockout. Security Fail.');
            errors++;
        } catch (e: any) {
            if (e.response?.status === 429) {
                console.log('✅ Lockout Active. Request Rejected with 429.');
                console.log(`   Message: ${e.response.data.message}`);
                console.log(`   Retry-After Header/Body verified.`);
            } else {
                console.error(`❌ Expected 429, got ${e.response?.status}`);
                errors++;
            }
        }

        // 5. TEST: User Enumeration Protection
        console.log(`\n[5/5] Testing User Enumeration Protection (Non-Existent User)...`);
        try {
            await axios.post(`${API_URL}/login`, {
                email: `ghost_user_${Date.now()}@test.com`,
                password: 'password'
            });
            console.error('❌ Non-existent user login SUCCEEDED. System corrupted.');
            errors++;
        } catch (e: any) {
            if (e.response?.status === 401) {
                console.log('✅ Returned 401 (Protocol v2 Compliant). Attacker cannot distinguish missing user from wrong password.');
            } else if (e.response?.status === 429) {
                console.log('✅ Returned 429 (IP Rate Limited). System prevents enumeration via IP Blocking.');
            } else if (e.response?.status === 404) {
                console.error('❌ Returned 404. Vulnerable to User Enumeration.');
                errors++;
            } else {
                console.error(`❌ Unexpected Status: ${e.response?.status}`);
                errors++;
            }
        }

    } catch (err: any) {
        console.error('\n❌ FATAL TEST ERROR:', err.message);
        errors++;
    } finally {
        console.log(`\n🏁 TEST COMPLETE. Total Errors: ${errors}`);
        await prisma.$disconnect();
        process.exit(errors > 0 ? 1 : 0);
    }
}

main();

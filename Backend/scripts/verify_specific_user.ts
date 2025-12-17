import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();
const EMAIL = 'girshprsjdpneet20@gmail.com'; // Exact from user request
const PASSWORD = 'Girish@197534'; // Exact from user request

async function main() {
    console.log(`🔍 Checking for user: ${EMAIL}`);

    const user = await prisma.users.findUnique({
        where: { email: EMAIL }
    });

    if (user) {
        console.log('✅ User EXISTS.');
        console.log('🔑 verifying password hash...');
        const isValid = await bcrypt.compare(PASSWORD, user.password_hash || '');
        if (isValid) {
            console.log('✅ Password Match: SUCCESS.');
        } else {
            console.warn('❌ Password Match: FAILED (Hash Mismatch).');
            console.log('🛠️  Updating Password to match user request...');
            const newHash = await bcrypt.hash(PASSWORD, 12);
            await prisma.users.update({
                where: { email: EMAIL },
                data: {
                    password_hash: newHash,
                    failed_login_attempts: 0, // Unlock
                    lockout_until: null // Unlock
                }
            });
            console.log('✅ Password UPDATED and Account UNLOCKED.');
        }

        if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
            console.warn('🔒 Account was LOCKED. Unlocking...');
            await prisma.users.update({
                where: { email: EMAIL },
                data: { lockout_until: null, failed_login_attempts: 0 }
            });
            console.log('✅ Account UNLOCKED.');
        }

    } else {
        console.warn('❌ User does NOT exist.');
        console.log('🛠️  Creating User with provided credentials...');
        const newHash = await bcrypt.hash(PASSWORD, 12);
        await prisma.users.create({
            data: {
                id: crypto.randomUUID(),
                email: EMAIL,
                password_hash: newHash,
                full_name: 'Girish (User Request)',
                referral_code: `REF_GIRISH_${Date.now()}`,
                updated_at: new Date(),
                is_active: true,
                is_verified: true
            }
        });
        console.log('✅ User CREATED successfully.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

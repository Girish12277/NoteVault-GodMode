const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function check() {
    try {
        const email = 'seller@studyvault.com';
        const password = 'Test@123';

        console.log(`Checking credentials for: ${email}`);

        const user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
            console.log('❌ User NOT found in DB.');
            return;
        }

        console.log('✅ User found.');

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (isValid) {
            console.log('✅ Password "Test@123" is VALID.');
        } else {
            console.log('❌ Password "Test@123" is INVALID.');
            // Generate a correct hash to show what it should be
            const newHash = await bcrypt.hash(password, 12);
            console.log('Expected Hash for Test@123:', newHash);
            console.log('Actual Hash in DB:', user.password_hash);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();

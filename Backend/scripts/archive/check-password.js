const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkAdminPassword() {
    try {
        const admin = await prisma.users.findFirst({
            where: { email: 'admin@studyvault.com' },
            select: { id: true, email: true, password_hash: true }
        });

        console.log('Admin Found:', admin ? 'YES' : 'NO');
        console.log('Email:', admin?.email);
        console.log('Hash:', admin?.password_hash?.substring(0, 30) + '...');

        // Test common passwords
        const passwords = ['Test@123', 'admin123', 'Test123', 'admin@123'];

        for (const pwd of passwords) {
            const match = await bcrypt.compare(pwd, admin.password_hash);
            console.log(`Password "${pwd}": ${match ? '✅ MATCH' : '❌ NO MATCH'}`);
            if (match) {
                console.log(`\n✅✅✅ CORRECT PASSWORD: ${pwd} ✅✅✅\n`);
                break;
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminPassword();

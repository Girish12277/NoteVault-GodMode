const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        // Check total users
        const totalUsers = await prisma.users.count();
        console.log(`✅ Total Users: ${totalUsers}`);

        // Check admin
        const admin = await prisma.users.findFirst({
            where: { email: 'admin@studyvault.com' },
            select: { id: true, email: true, full_name: true, is_admin: true, is_active: true }
        });
        console.log(`✅ Admin User:`, JSON.stringify(admin, null, 2));

        // Get 5 regular users for testing
        const testUsers = await prisma.users.findMany({
            where: { is_admin: false, is_active: true },
            take: 5,
            select: { id: true, email: true, full_name: true, is_active: true }
        });
        console.log(`✅ Test Users (${testUsers.length}):`, JSON.stringify(testUsers, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

test();

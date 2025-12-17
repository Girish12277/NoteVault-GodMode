const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        const count = await prisma.transactions.count();
        console.log(`Total Transactions: ${count}`);

        const successCount = await prisma.transactions.count({ where: { status: 'SUCCESS' } });
        console.log(`Successful Transactions: ${successCount}`);

        const distinctBuyers = await prisma.transactions.groupBy({
            by: ['buyer_id'],
            _count: true
        });
        console.log(`Distinct Buyers with Orders: ${distinctBuyers.length}`);

        if (distinctBuyers.length > 0) {
            console.log('Sample Buyer IDs:', distinctBuyers.slice(0, 5).map(b => b.buyer_id));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();

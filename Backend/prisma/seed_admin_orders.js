const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedAdminOrders() {
    try {
        console.log('🌱 Seeding orders for testing...');

        // 1. Find ALL Users
        const users = await prisma.users.findMany();
        console.log(`👥 Found ${users.length} users. Seeding for ALL...`);

        // 2. Find notes
        const notes = await prisma.notes.findMany({
            take: 5,
            where: { is_approved: true }
        });

        if (notes.length === 0) {
            console.error('❌ No approved notes found.');
            return;
        }

        for (const user of users) {
            console.log(`Processing User: ${user.full_name} (${user.id})`);
            // 3. Create Transactions for this user
            for (const note of notes) {
                // ... logic below ...
            }
        }

        for (const user of users) {
            for (const note of notes) {
                const existingOrder = await prisma.transactions.findFirst({
                    where: {
                        buyer_id: user.id,
                        note_id: note.id,
                        status: 'SUCCESS'
                    }
                });

                if (!existingOrder) {
                    await prisma.transactions.create({
                        data: {
                            amount_inr: note.price_inr || 100,
                            status: 'SUCCESS',
                            payment_gateway_payment_id: `seed_pay_${Math.random().toString(36).substring(7)}`,
                            payment_gateway_order_id: `seed_order_${Math.random().toString(36).substring(7)}`,
                            created_at: new Date(),
                            updated_at: new Date(),
                            // Relations
                            users_transactions_buyer_idTousers: { connect: { id: user.id } },
                            users_transactions_seller_idTousers: { connect: { id: note.seller_id } },
                            notes: { connect: { id: note.id } }
                        }
                    });
                    // console.log(`✅ Added to ${user.full_name}`);
                }
            }
        }

        console.log('🎉 Seeding Complete!');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdminOrders();

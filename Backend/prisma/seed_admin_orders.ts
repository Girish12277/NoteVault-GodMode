import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdminOrders() {
    try {
        console.log('🌱 Seeding orders for testing...');

        // 1. Find an Admin User (or creating one if none)
        let admin = await prisma.users.findFirst({
            where: { is_admin: true }
        });

        if (!admin) {
            // Fallback to any user if no admin found (unlikely)
            admin = await prisma.users.findFirst();
        }

        if (!admin) {
            console.error('❌ No users found in database to seed orders for.');
            return;
        }

        console.log(`👤 Assigned to User: ${admin.full_name} (${admin.id})`);

        // 2. Find some notes to "buy"
        const notes = await prisma.notes.findMany({
            take: 5,
            where: { is_approved: true } // Ensure we buy approved notes
        });

        if (notes.length === 0) {
            console.error('❌ No approved notes found to purchase.');
            return;
        }

        // 3. Find a seller (for the relation)
        // We'll just use the note's owner
        // But we need to make sure we don't buy our own notes if we are the seller (skip check for seed simplicity, but logically sound)

        // 4. Create Transactions
        for (const note of notes) {
            const existingOrder = await prisma.transactions.findFirst({
                where: {
                    buyer_id: admin.id,
                    note_id: note.id,
                    status: 'SUCCESS'
                }
            });

            if (!existingOrder) {
                await prisma.transactions.create({
                    data: {
                        id: require('crypto').randomUUID(),
                        transaction_id: `txn_${Math.random().toString(36).substring(7)}`,
                        amount_inr: note.price_inr || 100,
                        commission_inr: 10,
                        seller_earning_inr: (Number(note.price_inr || 100) - 10),
                        final_amount_inr: note.price_inr || 100,
                        payment_method: 'UPI',
                        buyer_id: admin.id,
                        seller_id: note.seller_id,
                        note_id: note.id,
                        status: 'SUCCESS',
                        payment_gateway_payment_id: `seed_pay_${Math.random().toString(36).substring(7)}`,
                        payment_gateway_order_id: `seed_order_${Math.random().toString(36).substring(7)}`,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });
                console.log(`✅ Added to Library: "${note.title}"`);
            } else {
                console.log(`ℹ️ Already in Library: "${note.title}"`);
            }
        }

        console.log('🎉 Seeding Complete! Refresh your Library.');

    } catch (e) {
        console.error('Error seeding orders:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdminOrders();

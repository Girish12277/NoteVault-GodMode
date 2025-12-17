const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureAdminNotes() {
    const email = 'admin@studyvault.com';
    console.log(`🔍 Checking Library for: ${email}`);

    try {
        // 1. Find User
        const user = await prisma.users.findUnique({
            where: { email: email }
        });

        if (!user) {
            console.error(`❌ User ${email} NOT FOUND in database!`);
            // Try to find ANY admin to report back
            const anyAdmin = await prisma.users.findFirst({ where: { role: 'ADMIN' } });
            if (anyAdmin) console.log(`💡 Found alternative admin: ${anyAdmin.email}`);
            return;
        }

        console.log(`✅ User Found: ${user.full_name} (${user.id})`);

        // 2. Check Transactions
        const count = await prisma.transactions.count({
            where: {
                buyer_id: user.id,
                status: 'SUCCESS'
            }
        });

        console.log(`📊 Current Notes in Library: ${count}`);

        if (count > 0) {
            console.log('✅ CONFIRMED: User already has notes.');
            return;
        }

        // 3. Seed if empty
        console.log('⚠️ Library is empty. Seeding now...');
        const notes = await prisma.notes.findMany({
            where: { is_approved: true },
            take: 3
        });

        if (notes.length === 0) {
            console.error('❌ No approved notes found in DB to purchase.');
            return;
        }

        for (const note of notes) {
            // Check if already exists to avoid unique constraint if re-run
            const exists = await prisma.transactions.findFirst({
                where: {
                    buyer_id: user.id,
                    note_id: note.id
                }
            });

            if (exists) {
                console.log(`ℹ️ Already owned: "${note.title}"`);
                continue;
            }

            try {
                const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                await prisma.transactions.create({
                    data: {
                        id: txId,
                        transaction_id: txId, // REQUIRED FIELD
                        amount_inr: note.price_inr || 100,
                        status: 'SUCCESS',
                        payment_gateway_payment_id: `manual_pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        payment_gateway_order_id: `manual_order_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        created_at: new Date(),
                        updated_at: new Date(),
                        buyer_id: user.id,
                        seller_id: note.seller_id,
                        note_id: note.id,
                        payment_method: 'UPI',
                        commission_inr: 0,
                        seller_earning_inr: note.price_inr || 100,
                        final_amount_inr: note.price_inr || 100
                    }
                });
                console.log(`➕ Added Note: "${note.title}"`);
            } catch (err) {
                console.error(`Failed to add note ${note.id}:`, err.message);
            }
        }

        console.log(`🎉 SUCCESS: Added 3 notes to ${email}`);

    } catch (e) {
        console.error('❌ Error during verification:', e);
    } finally {
        await prisma.$disconnect();
    }
}

ensureAdminNotes();

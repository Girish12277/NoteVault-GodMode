
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('--- FIX SELLER ROLE START ---');
  try {
    const users = await prisma.users.findMany();
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      console.log(`Processing User: ${user.email} (Current Seller Status: ${user.is_seller})`);
      
      // 1. Update User to be Seller
      if (!user.is_seller) {
        await prisma.users.update({
          where: { id: user.id },
          data: { is_seller: true }
        });
        console.log(`- Updated ${user.email} to is_seller=true`);
      } else {
        console.log(`- ${user.email} is already a seller.`);
      }

      // 2. Ensure Wallet Exists
      const wallet = await prisma.seller_wallets.findUnique({
        where: { seller_id: user.id }
      });

      if (!wallet) {
        console.log(`- Creating wallet for ${user.email}...`);
        await prisma.seller_wallets.create({
          data: {
            id: crypto.randomUUID(),
            seller_id: user.id,
            available_balance_inr: 0,
            pending_balance_inr: 0,
            total_earned_inr: 0,
            total_withdrawn_inr: 0,
            minimum_withdrawal_amount: 100,
            is_active: true,
            updated_at: new Date()
          }
        });
        console.log(`- Wallet created.`);
      } else {
        console.log(`- Wallet already exists.`);
      }
    }
    
    console.log('--- FIX SELLER ROLE COMPLETE ---');
  } catch (error) {
    console.error('Error fixing roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

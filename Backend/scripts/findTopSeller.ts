
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const topSeller = await prisma.users.findFirst({
        where: { is_seller: true },
        include: { _count: { select: { notes: true } } },
        orderBy: { notes: { _count: 'desc' } }
    });

    if (topSeller) {
        console.log(`TOP_SELLER_EMAIL: ${topSeller.email}`);
        console.log(`TOP_SELLER_NAME: ${topSeller.full_name}`);
        console.log(`NOTE_COUNT: ${topSeller._count.notes}`);
    } else {
        console.log("No seller found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());

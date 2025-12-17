
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const note = await prisma.notes.findUnique({
      where: { id: '4777eb9e-f561-423e-9a2e-9d2511597d70' }
    });
    console.log(JSON.stringify(note, null, 2));
  } catch (error) {
    console.error('Error fetching note:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

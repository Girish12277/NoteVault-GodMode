
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const noteId = '854a9b55-3823-4340-aa72-fe0c8c60';

async function main() {
  console.log('--- CHECKING NOTE ---');
  const note = await prisma.notes.findUnique({
    where: { id: noteId },
    select: { id: true, title: true, preview_pages: true, cover_image: true }
  });
  console.log(note);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

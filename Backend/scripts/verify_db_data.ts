
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- DB VERIFICATION START ---');
    // Just get the last created note
    const note = await prisma.notes.findFirst({
        orderBy: {
            created_at: 'desc'
        }
    });

    if (note) {
        console.log('Sample Note ID:', note.id);
        console.log('Preview Pages RAW:', JSON.stringify(note.preview_pages, null, 2));
        console.log('Type:', typeof note.preview_pages);
        console.log('Is Array?', Array.isArray(note.preview_pages));
    } else {
        console.log('No notes found in DB.');
    }
    console.log('--- DB VERIFICATION END ---');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

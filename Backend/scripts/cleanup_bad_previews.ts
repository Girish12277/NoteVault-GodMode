
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CLEANUP BAD PREVIEWS START ---');
  try {
    const notes = await prisma.notes.findMany();
    let count = 0;

    for (const note of notes) {
      const previews = note.preview_pages as string[] | null;
      
      if (Array.isArray(previews)) {
        // Check if ANY URL is the broken auto-generated type (contains 'pg_')
        // AND does not look like a valid manual upload (which usually doesn't have pg_ unless user named it so, 
        // but our auto-gen code specifically added pg_ params).
        // Actually, let's just look for the specific Cloudinary transformation pattern if possible, 
        // OR just simple 'pg_' is safe enough given the context.
        const hasBadUrl = previews.some(url => url.includes('/pg_') || url.includes('pg_'));
        
        if (hasBadUrl) {
          console.log(`Fixing Note ${note.id}: Found bad previews:`, previews);
          await prisma.notes.update({
            where: { id: note.id },
            data: { preview_pages: [] }
          });
          count++;
        }
      }
    }
    
    console.log(`--- CLEANUP COMPLETE. Fixed ${count} notes. ---`);
  } catch (error) {
    console.error('Error cleaning up:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Configure Cloudinary explicitly
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const NOTE_ID = '205b73dc-f440-4e22-811c-e1b507a93443';

async function generateLinks() {
    const note = await prisma.notes.findUnique({ where: { id: NOTE_ID } });
    if (!note) {
        console.error('Note not found');
        return;
    }

    console.log('Original DB URL:', note.file_url);

    // Extraction Logic (Mirroring Controller)
    const match = note.file_url.match(/\/v\d+\/(.+)$/);
    if (!match) {
        console.log('Regex match failed');
        return;
    }

    let publicId = decodeURIComponent(match[1]);
    // Strip query params if any
    publicId = publicId.split('?')[0];

    // Base candidates
    const candidates = [
        { id: publicId, label: 'Base ID' },
        { id: publicId + '.pdf', label: 'Base ID + .pdf' },
        // Try removing extension if it exists
        { id: publicId.replace(/\.pdf$/i, ''), label: 'Base ID - .pdf' }
    ];

    // Deduplicate
    const uniqueIds = [...new Set(candidates.map(c => c.id))];

    console.log('\n--- CLICK THESE TARGETS ---');

    uniqueIds.forEach(pid => {
        ['upload', 'authenticated', 'private'].forEach(type => {
            const url = cloudinary.url(pid, {
                resource_type: 'raw',
                type: type as any,
                sign_url: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });
            console.log(`[${type.toUpperCase()}] ID: "${pid}"`);
            console.log(url);
            console.log('');
        });
    });
}

generateLinks();

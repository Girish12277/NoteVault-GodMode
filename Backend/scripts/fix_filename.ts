
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const prisma = new PrismaClient();

const OLD_ID_DECODED = "studyvault/notes/user_admin_001/1765573890459_Voter List 2003.pdf";
const OLD_ID_ENCODED = "studyvault/notes/user_admin_001/1765573890459_Voter%20List%202003.pdf";
const NEW_ID = "studyvault/notes/user_admin_001/1765573890459_VoterList2003.pdf";

const NOTE_ID = "205b73dc-f440-4e22-811c-e1b507a93443";

async function fix() {
    console.log('--- RENAMING RESOURCE ---');

    // 1. Try to rename 
    // We try encoded first, then decoded if fail
    try {
        console.log(`Renaming "${OLD_ID_DECODED}" -> "${NEW_ID}"...`);
        const result = await cloudinary.uploader.rename(OLD_ID_DECODED, NEW_ID, { resource_type: 'raw' });
        console.log('✅ Cloudinary Rename Success:', result);
    } catch (e: any) {
        console.log(`⚠️  Rename Decoded failed: ${e.message}`);
        try {
            console.log(`Renaming "${OLD_ID_ENCODED}" -> "${NEW_ID}"...`);
            const result = await cloudinary.uploader.rename(OLD_ID_ENCODED, NEW_ID, { resource_type: 'raw' });
            console.log('✅ Cloudinary Rename Success:', result);
        } catch (e2: any) {
            console.log(`❌ Rename Encoded failed: ${e2.message}`);
            // Proceed if it says "resource not found" (maybe already renamed?)
        }
    }

    // 2. Fetch New URL Logic
    const newUrl = cloudinary.url(NEW_ID, { resource_type: 'raw', type: 'upload', secure: true });
    console.log('New URL:', newUrl);

    // 3. Update DB
    console.log('Updating Database...');
    const update = await prisma.notes.update({
        where: { id: NOTE_ID },
        data: { file_url: newUrl }
    });
    console.log('✅ Database Update Success:', update.file_url);
}

fix();

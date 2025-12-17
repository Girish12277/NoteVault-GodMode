import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const CANDIDATES = [
    'studyvault/notes/user_admin_001/1765573890459_Voter List 2003.pdf',
    'studyvault/notes/user_admin_001/1765573890459_Voter List 2003',
    'studyvault/notes/user_admin_001/1765573890459_Voter%20List%202003.pdf'
];

async function inspect() {
    console.log('--- INSPECTING RESOURCES ---');

    for (const pid of CANDIDATES) {
        console.log(`\nChecking Public ID: "${pid}"`);
        try {
            const result = await cloudinary.api.resource(pid, { resource_type: 'raw' });
            console.log('✅ FOUND!');
            // Write full result to file
            fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
            console.log('Saved to result.json');
            return;
        } catch (err: any) {
            console.log(`❌ Failed: ${err.message}`);
        }
    }
    console.log('\n--- END ---');
}

inspect();

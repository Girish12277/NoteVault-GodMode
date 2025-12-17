
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

dotenv.config({ path: path.join(__dirname, '../.env') });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const PID_CLEAN = "studyvault/notes/user_admin_001/1765573890459_VoterList2003.pdf";
const VERSION = "1765573895";

console.log('--- VERIFYING CLEAN ID ---');

// Generate the "Gold Standard" URL (Same as Keyring V5)
const url = cloudinary.url(PID_CLEAN, {
    resource_type: 'raw',
    type: 'upload',
    sign_url: true,
    secure: true,
    flags: 'attachment',
    version: VERSION
});

console.log(`Testing URL: ${url}`);

try {
    const cmd = `curl -I -s -o NUL -w "%{http_code}" "${url}"`;
    const code = execSync(cmd).toString().trim();
    console.log(`HTTP: ${code}`);

    if (code === '200') {
        console.log('✅✅✅ CLEAN ID WORKING ✅✅✅');
    } else {
        console.log(`❌ Failed with ${code}`);
    }
} catch (e: any) {
    console.log(`Error: ${e.message}`);
}

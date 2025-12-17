
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

const PID_ENCODED = "studyvault/notes/user_admin_001/1765573890459_Voter%20List%202003.pdf";
const VERSION = "1765573895";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

function test(label: string, url: string) {
    console.log(`\nTesting: ${label}`);
    console.log(`URL: ${url}`);

    try {
        // Add User Agent
        const cmd = `curl -I -s -o NUL -w "%{http_code}" -A "${UA}" "${url}"`;
        const code = execSync(cmd).toString().trim();
        console.log(`HTTP: ${code}`);
        if (code === '200') {
            console.log('✅✅✅ WINNER ✅✅✅');
            process.exit(0);
        }
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

console.log('--- THE HAIL MARY ---');

// 1. Attachment + Signed + Encoded
const url1 = cloudinary.url(PID_ENCODED, {
    resource_type: 'raw',
    type: 'upload',
    sign_url: true,
    secure: true,
    flags: 'attachment',
    version: VERSION
});
test('Attachment + Signed + Encoded', url1);

// 2. Authenticated + No Version
// Manual construction to skip SDK defaults if needed
const sign2 = cloudinary.utils.api_sign_request({ public_id: PID_ENCODED, timestamp: Math.floor(Date.now() / 1000) }, process.env.CLOUDINARY_API_SECRET!);
const url2 = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/authenticated/s--${sign2}--/${PID_ENCODED}`;
// SDK doesn't support 'authenticated' type perfectly without version usually.
test('Authenticated + Manual Sig + No Version', url2);

// 3. Upload + Signed + Timestamp (Force)
// Standard 'sign_url' usually handles this but let's be explicit
const url3 = cloudinary.url(PID_ENCODED, {
    resource_type: 'raw',
    type: 'upload',
    sign_url: true,
    secure: true,
    version: VERSION
});
test('Upload + Signed + Encoded (Standard)', url3);

// 4. Private Download URL Utility
const url4 = cloudinary.utils.private_download_url(PID_ENCODED, 'pdf', {
    resource_type: 'raw',
    type: 'upload', // SDK says type param supported?
    expires_at: Math.floor(Date.now() / 1000) + 3600
});
test('Private Download Utility', url4 || "Failed to generate");

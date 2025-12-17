
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

const PID_DECODED = "studyvault/notes/user_admin_001/1765573890459_Voter List 2003.pdf";
const PID_ENCODED = "studyvault/notes/user_admin_001/1765573890459_Voter%20List%202003.pdf";
const VERSION = "1765573895";

function test(label: string, pid: string) {
    const url = cloudinary.url(pid, {
        resource_type: 'raw',
        type: 'upload',
        sign_url: true,
        secure: true,
        flags: 'attachment',
        version: VERSION
    });

    console.log(`\nTesting: ${label}`);
    console.log(`URL: ${url}`);

    try {
        const cmd = `curl -I -s -o NUL -w "%{http_code}" "${url}"`;
        const code = execSync(cmd).toString().trim();
        console.log(`HTTP: ${code}`);
        if (code === '200') console.log('✅ SUCCESS');
        else console.log('❌ FAILED');
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

console.log('--- VERIFYING ATTACHMENT SIGNED ---');
test('Decoded ID', PID_DECODED);
test('Encoded ID', PID_ENCODED);

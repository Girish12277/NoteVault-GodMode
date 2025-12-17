
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

const PID = "studyvault/notes/user_admin_001/1765573890459_VoterList2003.pdf";
const VERSION = "1765573895";

function test(label: string, url: string) {
    console.log(`\nTesting: ${label}`);
    try {
        const cmd = `curl -I -s -o NUL -w "%{http_code}" "${url}"`;
        const code = execSync(cmd).toString().trim();
        console.log(`HTTP: ${code}`);
        if (code === '200') {
            console.log('✅✅✅ SUCCESS ✅✅✅');
            console.log(`Working URL: ${url}`);
            process.exit(0);
        }
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

console.log('--- NUCLEAR TEST (CLEAN ID) ---');

// 1. Authenticated Type (Signed)
const urlAuth = cloudinary.url(PID, {
    resource_type: 'raw', type: 'authenticated',
    sign_url: true, secure: true, version: VERSION
});
test('Authenticated Type', urlAuth);

// 2. Private Download URL
const urlPriv = cloudinary.utils.private_download_url(PID, 'pdf', {
    resource_type: 'raw', type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 3600
});
test('Private Download Utility', urlPriv || "Fail");

// 3. Token Auth (Clean Path)
const acl = `/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/v${VERSION}/${PID}`;
const token = cloudinary.utils.generate_auth_token({
    key: process.env.CLOUDINARY_API_KEY!,
    acl: acl,
    duration: 3600
});
const urlToken = cloudinary.url(PID, {
    resource_type: 'raw', type: 'upload',
    secure: true, version: VERSION, sign_url: false
}) + `?token=${token}`;
test('Token Auth', urlToken);

// 4. Transform Mode (Sign attachment only?)
// Maybe explicit signature generation?
const urlExplicit = cloudinary.url(PID, {
    resource_type: 'raw', type: 'upload',
    secure: true, version: VERSION,
    sign_url: true,
    flags: 'attachment'
});
// This failed before, but testing again in this suite.
test('Attachment Signed', urlExplicit);

// 5. Unsigned Attachment (Just in case)
const urlUnsigned = cloudinary.url(PID, {
    resource_type: 'raw', type: 'upload',
    secure: true, version: VERSION,
    flags: 'attachment'
});
test('Attachment Unsigned', urlUnsigned);


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

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
// The path components
const VERSION = "1765573895";
const NAMESPACE = "studyvault/notes/user_admin_001";
const FILENAME_DECODED = "1765573890459_Voter List 2003.pdf";
const FILENAME_ENCODED = "1765573890459_Voter%20List%202003.pdf";

// The Request URL must use Encoded Filename
const REQUEST_URL = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/v${VERSION}/${NAMESPACE}/${FILENAME_ENCODED}`;

// The Token ACL uses... DECODED Filename?
const ACL_PATH = `/${CLOUD_NAME}/raw/upload/v${VERSION}/${NAMESPACE}/${FILENAME_DECODED}`;

console.log('--- VERIFYING TOKEN (DECODED ACL) ---');
console.log(`Request URL: ${REQUEST_URL}`);
console.log(`ACL Path:    ${ACL_PATH}`);

try {
    const token = cloudinary.utils.generate_auth_token({
        key: process.env.CLOUDINARY_API_KEY!,
        acl: ACL_PATH,
        duration: 3600,
        start_time: Math.floor(Date.now() / 1000),
    });

    const url = `${REQUEST_URL}?token=${token}`;

    // Curl it
    const cmd = `curl -I -s -o NUL -w "%{http_code}" "${url}"`;
    const code = execSync(cmd).toString().trim();

    console.log(`HTTP: ${code}`);
    if (code === '200') {
        console.log('✅ SUCCESS! ACL MUST BE DECODED.');
    } else {
        console.log('❌ FAILED.');
    }

} catch (e: any) {
    console.log(`Error: ${e.message}`);
}

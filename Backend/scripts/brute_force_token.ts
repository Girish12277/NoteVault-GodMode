
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

// Ground Truth from result.json
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const PUBLIC_ID_RAW = "studyvault/notes/user_admin_001/1765573890459_Voter%20List%202003.pdf";
const VERSION = "1765573895";
const BASE_URL = `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/v${VERSION}/${PUBLIC_ID_RAW}`;

// ACL Paths to Test
const PATH_WITHOUT_CLOUD = `/raw/upload/v${VERSION}/${PUBLIC_ID_RAW}`;
const PATH_WITH_CLOUD = `/${CLOUD_NAME}${PATH_WITHOUT_CLOUD}`;

const ACL_VARIANTS = [
    { label: "Wildcard Root", acl: "/*" },
    { label: "Wildcard Cloud", acl: `/${CLOUD_NAME}/*` },
    { label: "Wildcard Raw", acl: `/${CLOUD_NAME}/raw/upload/*` },
    { label: "Exact Path (With Cloud)", acl: PATH_WITH_CLOUD },
    { label: "Exact Path (No Cloud)", acl: PATH_WITHOUT_CLOUD },
];

console.log('--- STARTING TOKEN BRUTE FORCE ---');
console.log(`Base URL: ${BASE_URL}`);

function testToken(label: string, acl: string) {
    try {
        const token = cloudinary.utils.generate_auth_token({
            key: process.env.CLOUDINARY_API_KEY!,
            acl: acl,
            duration: 3600,
            start_time: Math.floor(Date.now() / 1000),
        });

        const url = `${BASE_URL}?token=${token}`;

        console.log(`\nTesting: ${label}`);
        console.log(`ACL: ${acl}`);

        // Use Curl to test
        // -I for HEAD, -s for silent, -o /dev/null to discard body, -w to print HTTP code
        const cmd = `curl -I -s -o NUL -w "%{http_code}" "${url}"`;
        const httpCode = execSync(cmd).toString().trim();

        console.log(`Creating Token... Done.`);
        console.log(`HTTP Status: ${httpCode}`);

        if (httpCode === '200') {
            console.log('✅✅✅ MATCH FOUND! ✅✅✅');
            console.log(`Working ACL Logic: "${acl}"`);
            process.exit(0);
        }
    } catch (err: any) {
        console.log(`Error: ${err.message}`);
    }
}

for (const variant of ACL_VARIANTS) {
    testToken(variant.label, variant.acl);
}

console.log('\n❌ ALL FAILED');

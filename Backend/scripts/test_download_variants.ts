
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

const PID = "studyvault/notes/user_admin_001/1765573890459_Voter List 2003.pdf";
const VERSION = "1765573895";

// Variants to test
const variants = [
    {
        name: "Standard Unsigned (Referrer)",
        url: cloudinary.url(PID, { resource_type: 'raw', type: 'upload', version: VERSION, secure: true }),
        referrer: 'http://localhost:8080'
    },
    {
        name: "Attachment Unsigned",
        url: cloudinary.url(PID, { resource_type: 'raw', type: 'upload', version: VERSION, secure: true, flags: 'attachment' }),
        referrer: ''
    },
    {
        name: "Attachment Signed",
        url: cloudinary.url(PID, { resource_type: 'raw', type: 'upload', version: VERSION, secure: true, flags: 'attachment', sign_url: true }),
        referrer: ''
    },
    {
        name: "Signed (Standard)",
        url: cloudinary.url(PID, { resource_type: 'raw', type: 'upload', version: VERSION, secure: true, sign_url: true }),
        referrer: ''
    }
];

console.log('--- TESTING VARIANTS ---');

variants.forEach(v => {
    console.log(`\nTesting: ${v.name}`);
    try {
        const refFlag = v.referrer ? `-e "${v.referrer}"` : '';
        const cmd = `curl -I -s -o NUL -w "%{http_code}" ${refFlag} "${v.url}"`;
        const code = execSync(cmd).toString().trim();
        console.log(`URL: ${v.url}`);
        console.log(`HTTP: ${code}`);

        if (code === '200') {
            console.log('✅ WINNER!');
        } else if (code === '302' || code === '301') {
            console.log('⚠️ REDIRECT (Might be good)');
        }
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
});

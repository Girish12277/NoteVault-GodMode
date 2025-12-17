import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5002/api'; // Using Verification Port
const PAYMENT_URL = `${API_URL}/payments`;
const AUTH_URL = `${API_URL}/auth/login`;

// USER CREDENTIALS (FROM PROMPT)
const BUYER_EMAIL = 'girshprsjdpneet20@gmail.com';
const BUYER_PASSWORD = 'Girish@197534';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';

async function main() {
    console.log('\n🚀 INITIALIZING GOD-LEVEL E2E TEST: 120 NOTES PURCHASE\n');

    try {
        // 1. AUTHENTICATE BUYER
        console.log(`🔑 Logging in as ${BUYER_EMAIL}...`);
        const loginRes = await axios.post(AUTH_URL, {
            email: BUYER_EMAIL,
            password: BUYER_PASSWORD
        });

        if (!loginRes.data.success) throw new Error('Login Failed');
        const token = loginRes.data.data.accessToken;
        const buyerId = loginRes.data.data.user.id;
        console.log(`✅ Login Success. Buyer ID: ${buyerId}`);

        const headers = { Authorization: `Bearer ${token}` };

        // 2. SETUP: Create Seller and 120 Notes
        console.log('\n📦 Seeding 120 Notes (if needed)...');

        // Ensure Seller Exists
        let seller = await prisma.users.findFirst({ where: { email: 'god_bulk_seller@test.com' } });
        if (!seller) {
            seller = await prisma.users.create({
                data: {
                    id: crypto.randomUUID(),
                    email: 'god_bulk_seller@test.com',
                    password_hash: 'hash',
                    full_name: 'God Bulk Seller',
                    referral_code: `REF_BULK_${Date.now()}`,
                    updated_at: new Date(),
                    is_active: true,
                    is_verified: true,
                    is_seller: true
                }
            });
        }

        // Create 120 Notes
        const noteIds: string[] = [];
        const existingNotes = await prisma.notes.findMany({ where: { seller_id: seller.id } });

        if (existingNotes.length >= 120) {
            console.log(`   Found ${existingNotes.length} existing notes. Using first 120.`);
            existingNotes.slice(0, 120).forEach(n => noteIds.push(n.id));
        } else {
            const needed = 120 - existingNotes.length;
            console.log(`   Creating ${needed} new notes...`);

            // Ensure University Exists
            let uni = await prisma.universities.findFirst();
            if (!uni) {
                uni = await prisma.universities.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: 'God Tier University',
                        country: 'India',
                        city: 'Mumbai', // Added missing required fields
                        abbr: 'GTU',
                        is_active: true
                    }
                });
            }

            for (let i = 0; i < needed; i++) {
                const note = await (prisma.notes as any).create({
                    data: {
                        id: crypto.randomUUID(),
                        title: `God Bulk Note ${existingNotes.length + i + 1}`,
                        description: 'Bulk test note',
                        subject: 'Testing',
                        degree: 'B.Tech',
                        semester: 1,
                        year: 1,
                        university_id: uni.id,
                        // language: 'en', // Removed to use default (Avoid Enum import issue)
                        price_inr: 10,
                        commission_percentage: 10,
                        commission_amount_inr: 1,
                        seller_earning_inr: 9,
                        seller_id: seller.id,
                        file_url: 'https://res.cloudinary.com/demo/image/upload/v1/sample.pdf',
                        file_type: 'pdf',
                        file_size_bytes: BigInt(1024 * 1024), // 1MB
                        total_pages: 5,
                        preview_pages: [],
                        tags: [],
                        table_of_contents: [],
                        is_approved: true,
                        is_active: true,
                        created_at: new Date(),
                        updated_at: new Date()
                    } as any
                });
                noteIds.push(note.id);
            }
            // Add existing ones if we started partial
            existingNotes.forEach(n => noteIds.push(n.id));
        }

        const targetNotes = noteIds.slice(0, 120);
        console.log(`✅ Selected ${targetNotes.length} Notes for Purchase.`);

        // 3. CREATE ORDER
        console.log(`\n🛒 Creating Order for 120 Items...`);
        let orderId = '';
        let amount = 0;
        let skipPayment = false;

        try {
            const orderRes = await axios.post(`${PAYMENT_URL}/create-order`, { noteIds: targetNotes }, { headers });
            orderId = orderRes.data.data.orderId;
            amount = orderRes.data.data.amount;
            console.log(`✅ Order Created: ${orderId}`);
        } catch (err: any) {
            if (err.response?.data?.code === 'ALREADY_PURCHASED') {
                console.log('⚠️  Notes already purchased. Skipping Payment & Creating Download Verification...');
                skipPayment = true;
            } else {
                throw err;
            }
        }

        if (!skipPayment) {
            // 4. VERIFY PAYMENT (MOCK)
            const paymentId = `pay_GodBulk_${Date.now()}`;
            const signature = crypto
                .createHmac('sha256', RAZORPAY_KEY_SECRET)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');

            console.log(`\n🔐 Verifying Payment...`);
            const verifyRes = await axios.post(`${PAYMENT_URL}/verify`, {
                razorpayOrderId: orderId,
                razorpayPaymentId: paymentId,
                razorpaySignature: signature
            }, { headers });

            if (!verifyRes.data.success) throw new Error('Verification Failed');
            console.log('✅ Payment Verified Successfully!');

            // 5. DOWNLOAD INVOICE
            console.log(`\n📄 Downloading Invoice...`);
            const invoiceUrl = `${PAYMENT_URL}/invoice/${paymentId}`;
            const pdfRes = await axios.get(invoiceUrl, { headers, responseType: 'arraybuffer' });

            fs.writeFileSync('god_bulk_invoice.pdf', pdfRes.data);
            console.log(`✅ Invoice Saved: god_bulk_invoice.pdf (${pdfRes.data.length} bytes)`);
        } else {
            console.log('⏩ Skipped Payment/Invoice stages due to existing ownership.');
        }

        // 6. DB VERIFICATION
        console.log(`\n🔍 Verifying DB Records...`);
        const purchases = await prisma.purchases.count({
            where: {
                user_id: buyerId,
                note_id: { in: targetNotes }
            }
        });

        if (purchases === 120) {
            console.log(`✅ DATABASE CONFIRMED: 120 Purchases Recorded.`);
        } else {
            console.error(`❌ DATABASE MISMATCH: Found ${purchases} purchases, expected 120.`);
            process.exit(1);
        }

        // 7. BULK DOWNLOAD PROOF (User Demand)
        console.log(`\n📥 Starting BULK DOWNLOAD Verification (120 Files)...`);
        const downloadDir = path.join(__dirname, '..', 'download_proof_120');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        let downloadedCount = 0;
        // Download Sequentially to avoid saturating Node/Network (User wants correctness > speed)
        for (let i = 0; i < targetNotes.length; i++) {
            const noteId = targetNotes[i];
            const fileName = `note_${i + 1}_${noteId.substring(0, 8)}.pdf`;
            const filePath = path.join(downloadDir, fileName);

            try {
                // GET /api/download/note/:id
                const dlRes = await axios.get(`${API_URL}/download/note/${noteId}`, {
                    headers,
                    responseType: 'arraybuffer'
                });

                fs.writeFileSync(filePath, dlRes.data);

                // Pure Feedback for User
                process.stdout.write(`   [${i + 1}/120] Downloaded: ${fileName} (${dlRes.data.length} bytes)\r`);
                downloadedCount++;

                // THROTTLE: Stay under 60 req/min API Limit (1 req every 1000ms + buffer)
                await new Promise(resolve => setTimeout(resolve, 1100));

            } catch (err: any) {
                if (err.response?.status === 429) {
                    console.error(`\n❌ Rate Limited on Note ${i + 1}. Slowing down...`);
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Cooldown
                    i--; // Retry
                } else {
                    console.error(`\n❌ Failed to download Note ${i + 1}: ${err.message}`);
                }
            }
        }

        console.log(`\n\n✅ Bulk Download Complete. Success: ${downloadedCount}/120.`);

        if (downloadedCount !== 120) {
            throw new Error(`Only downloaded ${downloadedCount}/120 files.`);
        }

        console.log(`📂 Files saved to: ${downloadDir}`);

    } catch (error: any) {
        console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
        if (error.response?.status === 413) {
            console.error('   Hint: Payload Too Large (120 items > 10KB limit?)');
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        console.log('\n🏁 E2E CYCLE COMPLETE.');
    }
}

main();

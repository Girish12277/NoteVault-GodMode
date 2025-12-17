
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5001/api';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'mock_secret';

// Use a real HTTPS PDF so the backend can proxy it successfully
const TARGET_PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf';

async function main() {
    console.log('🚀 GOD E2E (JS) [FULL FLOW: Purchase + Download]...');

    let buyerToken = '';
    let sellerId = '';
    let sellerToken = '';

    try {
        await prisma.$connect();
        const now = new Date();

        // 0. Create University (Prisma)
        const uniId = crypto.randomUUID();
        await prisma.universities.create({
            data: { id: uniId, name: `God Univ ${Date.now()}`, short_name: 'GU', state: 'Delhi', city: 'Delhi', type: 'State', updated_at: now }
        });
        console.log(`🏫 University: ${uniId}`);

        // 1. Create Buyer via API
        const buyerEmail = `god_buyer_final_${Date.now()}@test.com`;
        const buyerPass = 'Password123!';
        try {
            console.log(`👤 Registering Buyer: ${buyerEmail}`);
            await axios.post(`${API_URL}/auth/register`, {
                email: buyerEmail,
                password: buyerPass,
                name: 'God Buyer Final',
                fullName: 'God Buyer Final',
                universityId: uniId
            });
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email: buyerEmail, password: buyerPass });
            buyerToken = loginRes.data.data.accessToken;
            console.log('✅ Buyer Logged In');
        } catch (e) {
            console.error('Buyer Auth Failed:', e.response?.data || e.message);
            throw e;
        }

        // 2. Create Seller via API
        const sellerEmail = `god_seller_final_${Date.now()}@test.com`;
        try {
            console.log(`👤 Registering Seller: ${sellerEmail}`);
            await axios.post(`${API_URL}/auth/register`, {
                email: sellerEmail,
                password: buyerPass,
                name: 'God Seller Final',
                fullName: 'God Seller Final',
                universityId: uniId
            });
            const loginRes = await axios.post(`${API_URL}/auth/login`, { email: sellerEmail, password: buyerPass });
            sellerToken = loginRes.data.data.accessToken;
            const sellerUser = await prisma.users.findUnique({ where: { email: sellerEmail } });
            sellerId = sellerUser.id;
            console.log(`✅ Seller Logged In (ID: ${sellerId})`);
        } catch (e) {
            console.error('Seller Auth Failed:', e.response?.data || e.message);
            throw e;
        }

        // 3. Create 18 Notes (Prisma)
        console.log('📚 Creating 18 Notes...');
        const noteIds = [];
        for (let i = 1; i <= 18; i++) {
            const noteId = crypto.randomUUID();
            await prisma.notes.create({
                data: {
                    id: noteId,
                    title: `God Note ${i}`,
                    description: 'Test',
                    subject: 'Eng',
                    price_inr: 100,
                    seller_id: sellerId,
                    file_url: TARGET_PDF_URL, // REAL HTTPS URL
                    file_type: 'pdf',
                    total_pages: 5,
                    is_approved: true,
                    is_active: true,
                    preview_pages: [],
                    created_at: now,
                    updated_at: now,
                    university_id: uniId,
                    degree: 'BTech',
                    semester: 1,
                    file_size_bytes: 1024,
                    commission_percentage: 20,
                    commission_amount_inr: 20,
                    seller_earning_inr: 80
                }
            });
            noteIds.push(noteId);
        }
        console.log(`✅ ${noteIds.length} Notes ready.`);

        // 4. Purchase
        const headers = { Authorization: `Bearer ${buyerToken}` };
        console.log('🛒 Buying 18 Items...');

        const orderRes = await axios.post(`${API_URL}/payments/create-order`, { noteIds }, { headers });
        const { orderId, amount } = orderRes.data.data;
        console.log(`✅ Order: ${orderId} (₹${amount / 100})`);

        // 5. Verify
        const paymentId = `pay_GodFull_${Date.now()}`;
        const signature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        const verifyRes = await axios.post(`${API_URL}/payments/verify`, {
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature
        }, { headers });

        if (verifyRes.data.success) {
            console.log('✅ Payment Verified!');

            // 6. Invoice Download
            const invoiceLink = `${API_URL}/payments/invoice/${paymentId}`;
            console.log(`📄 Invoice Link: ${invoiceLink}`);
            const invoicePdf = await axios.get(invoiceLink, { headers, responseType: 'arraybuffer' });
            const invPath = path.join(__dirname, '../god_invoice_final.pdf');
            fs.writeFileSync(invPath, invoicePdf.data);
            console.log(`✅ Invoice Saved: ${invPath}`);

            // 7. Post-Purchase Verification
            console.log('\n🔍 Check Transactions History...');
            const historyRes = await axios.get(`${API_URL}/payments/transactions?limit=50`, { headers });
            const transactions = historyRes.data.data.transactions;
            const purchasedNoteIds = noteIds;
            const historyNoteIds = transactions.map(t => t.note_id || t.note.id);
            const allFound = purchasedNoteIds.every(id => historyNoteIds.includes(id));

            if (purchasedNoteIds.length === 18 && transactions.length >= 18 && allFound) {
                console.log('✅ History Verified (18/18 Notes Found found).');
            } else {
                console.error('❌ History Mismatch!');
            }

            // 8. REAL NOTE DOWNLOAD
            console.log('\n📥 Attempting Real File Download (Proxy Check)...');
            const targetNoteId = noteIds[0];
            const downloadUrl = `${API_URL}/download/note/${targetNoteId}`;
            console.log(`🔗 Endpoint: ${downloadUrl}`);

            try {
                const notePdf = await axios.get(downloadUrl, { headers, responseType: 'arraybuffer' });
                const notePath = path.join(__dirname, '../god_downloaded_note_1.pdf');
                fs.writeFileSync(notePath, notePdf.data);

                if (fs.statSync(notePath).size > 100) {
                    console.log(`🌟 SUCCESS: Note Downloaded Successfully!`);
                    console.log(`   - Path: ${notePath}`);
                    console.log(`   - Size: ${fs.statSync(notePath).size} bytes`);
                } else {
                    console.error('❌ Downloaded file seems empty/corrupt.');
                }
            } catch (dlErr) {
                console.error('❌ Download Failed:', dlErr.message);
                if (dlErr.response) console.error(dlErr.response.data);
            }

        }

    } catch (e) {
        console.error('FAIL:', e.message);
        if (e.response) console.error(JSON.stringify(e.response.data, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();

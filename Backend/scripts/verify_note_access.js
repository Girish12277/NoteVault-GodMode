const axios = require('axios');

async function main() {
    console.log('🚀 STARING GOD-LEVEL NOTE ACCESS VERIFICATION...');
    try {
        // 1. Login as Buyer
        console.log('🔑 Step 1: Login as Buyer...');
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'buyer@studyvault.com',
            password: 'Test@123'
        });
        const token = loginRes.data.data.accessToken;
        console.log('   ✅ Login Successful.');

        // 2. Get Purchased Notes (via Transactions)
        console.log('\n📦 Step 2: Finding a purchased note...');
        const txRes = await axios.get('http://localhost:5001/api/payments/transactions?limit=1', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const transactions = txRes.data.data.transactions;
        if (!transactions || transactions.length === 0) {
            throw new Error('NO TRANSACTIONS FOUND. CAUTION: Cannot verify note access without a purchase first.');
        }

        // Transactions might be array, and each transaction has notes array.
        // Based on previous logs, transaction.notes is likely an array of objects relating to note
        // The endpoint GET /api/download/note/:id expects NOTE ID.
        // Let's extract Note ID from transaction.
        
        const lastTx = transactions[0];
        console.log('   Debug: Transaction Note Structure:', JSON.stringify(lastTx.note, null, 0));
        
        // Handle both Array (if changed) or Object (current)
        const purchasedNote = Array.isArray(lastTx.note) ? lastTx.note[0] : lastTx.note;
        
        if (!purchasedNote || !purchasedNote.id) {
             throw new Error('Transaction found but NO NOTE details inside.');
        }
        
        const noteId = purchasedNote.id;
        const noteTitle = purchasedNote.title;
        console.log(`   ✅ Found Note: "${noteTitle}" (${noteId})`);

        // 3. Attempt Download
        console.log(`\n⬇️ Step 3: Verifying PDF Access (Downloading)...`);
        const downloadUrl = `http://localhost:5001/api/download/note/${noteId}`;
        
        const dlRes = await axios.get(downloadUrl, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer',
            validateStatus: (status) => status < 500 // Let us handle 400s manually
        });

        console.log(`   Response Status: ${dlRes.status}`);

        if (dlRes.status !== 200) {
            const errorMsg = dlRes.data.toString();
            throw new Error(`Download Failed with Status ${dlRes.status}. Body: ${errorMsg}`);
        }

        const contentType = dlRes.headers['content-type'];
        const size = dlRes.data.byteLength;
        console.log(`   Content-Type: ${contentType}`);
        console.log(`   Size: ${size} bytes`);

        // 4. Verification Logic
        if (size < 100) {
            throw new Error(`File too small (${size} bytes). Likely invalid/empty.`);
        }
        
        // Note: The proxy download might return application/pdf OR octet-stream depending on upstream.
        // We accept both if size is valid.
        
        console.log('\n🎉 GOD-LEVEL VERIFICATION PASSED: USER CAN ACCESS PURCHASED NOTE PDF. 🎉');

    } catch (err) {
        console.error('\n❌ VERIFICATION FAILED:', err.message);
        if (err.response) {
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        }
        process.exit(1);
    }
}

main();

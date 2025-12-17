const axios = require('axios');
const fs = require('fs');

async function main() {
    try {
        // Authenticate as buyer (reuse hardcoded credential or simplified flow)
        // Here we just hit the endpoint assuming we have a valid token/paymentId from previous runs or we mock a login.
        // For E2E, it's better to login fresh.

        console.log('🚀 Login as Buyer...');
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'buyer@studyvault.com',
            password: 'Test@123'
        });
        const token = loginRes.data.data.accessToken;

        // Fetch last SUCCESS transaction from API to get a valid ID
        console.log('🔍 Fetching recent transactions...');
        const txRes = await axios.get('http://localhost:5001/api/payments/transactions?limit=10', {
            headers: { Authorization: `Bearer ${token}` }
        });

        // Find first SUCCESS transaction
        const lastTx = txRes.data.data.transactions.find(t => t.status === 'SUCCESS');
        if (!lastTx) {
            throw new Error('No transactions found to verify invoice.');
        }

        const paymentId = lastTx.payment_gateway_payment_id;
        console.log(`✅ Found Payment ID: ${paymentId}`);

        // Verify Invoice
        console.log('📄 Downloading Invoice...');
        const invoiceRes = await axios.get(`http://localhost:5001/api/payments/invoice/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
        });

        const contentType = invoiceRes.headers['content-type'];
        const size = invoiceRes.data.byteLength;

        console.log(`✅ Status: ${invoiceRes.status}`);
        console.log(`✅ Content-Type: ${contentType}`);
        console.log(`✅ Size: ${size} bytes`);

        if (contentType.includes('application/pdf') && size > 100) {
            console.log('\n🎉 GOD-LEVEL CHECK: INVOICE PDF IS VALID. 🎉');
            const outputPath = require('path').join(__dirname, '../invoice_output.pdf');
            fs.writeFileSync(outputPath, invoiceRes.data);
            console.log(`💾 Invoice saved to: ${outputPath}`);
        } else {
            throw new Error('Invalid PDF content');
        }

    } catch (err) {
        console.error('❌ Verification Failed:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else if (err.request) {
            console.error('No Response Received (Connection Error?)');
        }
        process.exit(1);
    }
}

main();

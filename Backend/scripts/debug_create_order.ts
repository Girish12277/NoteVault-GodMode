
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

async function debugCreateOrder() {
    try {
        console.log('🚀 Debugging Create Order (Retry)...');

        // 1. Login
        console.log('STEP 1: Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'buyer@studyvault.com',
            password: 'Test@123'
        });
        const token = loginRes.data.data.accessToken;
        console.log('✅ Logged in.');

        // 2. Get Notes
        console.log('STEP 2: Fetching Notes...');
        // Try getting a specific note directly if list fails, or list all
        // Assuming /api/notes/ is the list endpoint or /api/notes/public
        // Assuming /api/notes/ is the list endpoint
        const listRes = await axios.get(`${API_URL}/notes?search=Engineering`, {
             headers: { Authorization: `Bearer ${token}` }
        });
        
        const notes = listRes.data.data.notes;
        if (!notes || notes.length === 0) {
            console.error('❌ No notes found in search.');
            return;
        }

        const targetNote = notes[0];
        console.log(`📦 Targeted Note: ${targetNote.id} (${targetNote.title})`);

        // 3. Create Order
        console.log('STEP 3: Calling Create Order...');
        const payload = {
            noteIds: [targetNote.id], // Sending array of strings
            couponCode: null
        };
        console.log('📤 Payload:', JSON.stringify(payload, null, 2));

        const orderRes = await axios.post(`${API_URL}/payments/create-order`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ SUCCESS! Status:', orderRes.status);
        console.log('✅ Data:', orderRes.data);

    } catch (error: any) {
        console.log('❌ FAILED at Step:', error.config?.url);
        console.error('❌ Status:', error.response ? error.response.status : error.message);
        if (error.response) {
            console.error('❌ RESPONSE DATA:', JSON.stringify(error.response.data));
        }
    }
}

debugCreateOrder();

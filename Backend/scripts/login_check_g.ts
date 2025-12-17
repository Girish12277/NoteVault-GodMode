import axios from 'axios';

const API_URL = 'http://localhost:5002/api/auth/login';
const CREDENTIALS = {
    email: 'girshprsjdpneet20@gmail.com',
    password: 'Girish@197534'
};

async function check() {
    console.log(`🔑 Testing Login for: ${CREDENTIALS.email}`);
    try {
        const res = await axios.post(API_URL, CREDENTIALS);
        if (res.data.success) {
            console.log('✅ LOGIN SUCCESSFUL. Token received.');
            console.log('User ID:', res.data.data.user.id);
        } else {
            console.log('❌ Login Logic Failed:', res.data);
            process.exit(1);
        }
    } catch (e: any) {
        console.error('❌ Login Failed:', e.response?.data || e.message);
        process.exit(1);
    }
}

check();

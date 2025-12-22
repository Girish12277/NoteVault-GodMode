import http from 'http';

const COLORS = {
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    RESET: '\x1b[0m',
    YELLOW: '\x1b[33m',
    BOLD: '\x1b[1m'
};

const users = [
    { role: 'ADMIN', email: 'admin@studyvault.com', password: 'admin' },
    { role: 'SELLER', email: 'seller1@studyvault.com', password: 'admin' },
    { role: 'BUYER', email: 'buyer1@studyvault.com', password: 'admin' }
];

const coupons = [
    { code: 'WELCOME50', amount: 200, expectValid: true, desc: 'Valid > 150' },
    { code: 'WELCOME50', amount: 100, expectValid: false, desc: 'Invalid < 150' },
    { code: 'SAVE20', amount: 500, expectValid: true, desc: '20% Off' },
    { code: 'EXPIRED2024', amount: 1000, expectValid: false, desc: 'Expired' },
    { code: 'UNKNOWN123', amount: 500, expectValid: false, desc: 'Non-existent' }
];

function request(method: string, path: string, body: any = null, headers: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5001,
            path: `/api${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data }); // Fallback for non-JSON
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testLogin(user: any) {
    try {
        const response = await request('POST', '/auth/login', { email: user.email, password: user.password });

        if (response.status === 200 && response.data.success) {
            console.log(`${COLORS.GREEN}✔ Login Success: ${user.role} (${user.email})${COLORS.RESET}`);
            return response.data.data.accessToken;
        } else {
            console.log(`${COLORS.RED}✘ Login Failed: ${user.role} (${user.email})${COLORS.RESET}`);
            console.log(`   └-> Status: ${response.status}, Message: ${response.data.message || 'Unknown'}`);
            return null;
        }
    } catch (e: any) {
        console.log(`${COLORS.RED}✘ Login Connection Error: ${user.role} - ${e.message}${COLORS.RESET}`);
        return null;
    }
}

async function testCoupon(token: string, coupon: any) {
    try {
        const response = await request('POST', '/coupons/validate', {
            code: coupon.code,
            amount: coupon.amount,
            noteIds: []
        }, { 'Authorization': `Bearer ${token}` });

        const data = response.data;
        const isValid = !!(data.data && data.data.valid);

        if (isValid === coupon.expectValid) {
            console.log(`${COLORS.GREEN}✔ Coupon Check: ${coupon.code} (${coupon.desc}) -> ${isValid ? 'Valid' : 'Invalid'} (Expected)${COLORS.RESET}`);
            if (isValid) {
                console.log(`   └-> Discount: ₹${data.data.discountAmount}`);
            } else if (data.data && !isValid) {
                console.log(`   └-> Reason: ${data.data.message}`);
            }
        } else {
            console.log(`${COLORS.RED}✘ Coupon Check Mismatch: ${coupon.code} (${coupon.desc})${COLORS.RESET}`);
            console.log(`   └-> Expected ${coupon.expectValid}, got ${isValid}. Response:`, JSON.stringify(data));
        }

    } catch (e: any) {
        console.log(`${COLORS.RED}✘ Coupon API Error: ${coupon.code} - ${e.message}${COLORS.RESET}`);
    }
}

async function run() {
    console.log(`${COLORS.BOLD}🚀 STARTING LIVE VERIFICATION (Native HTTP) 🚀${COLORS.RESET}\n`);

    // 1. Test Logins
    console.log(`${COLORS.YELLOW}--- 🔐 Testing Credentials ---${COLORS.RESET}`);
    let buyerToken = null;

    for (const user of users) {
        const token = await testLogin(user);
        if (user.role === 'BUYER') buyerToken = token;
    }

    if (!buyerToken) {
        console.log(`\n${COLORS.RED}🚨 Cannot proceed with Coupon tests (Buyer login failed)${COLORS.RESET}`);
        return;
    }

    // 2. Test Coupons (using Buyer Token)
    console.log(`\n${COLORS.YELLOW}--- 🎟️ Testing Coupons (as Buyer) ---${COLORS.RESET}`);
    for (const coupon of coupons) {
        await testCoupon(buyerToken, coupon);
    }

    console.log(`\n${COLORS.BOLD}✅ VERIFICATION COMPLETE${COLORS.RESET}`);
}

run();

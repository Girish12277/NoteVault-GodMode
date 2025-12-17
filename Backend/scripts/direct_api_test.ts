
import axios from 'axios';
import { prisma } from '../src/config/database';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
    try {
        console.log("1. Fetching Admin User...");
        const admin = await prisma.users.findUnique({ where: { email: 'girshprsjdpneet20@gmail.com' } });
        if (!admin) throw new Error("Admin not found");

        console.log("2. Generating Token...");
        // Hardcoded secret for test certainty
        const secret = "your-super-secret-jwt-key-change-in-production-min-32-characters-long";
        if (!secret) throw new Error("JWT_SECRET missing in env");

        const token = jwt.sign(
            { id: admin.id, email: admin.email, is_admin: admin.is_admin },
            secret,
            { expiresIn: '1h' }
        );

        console.log("3. Finding Purchase...");
        const purchase = await prisma.purchases.findFirst({ where: { user_id: admin.id } });
        if (!purchase) throw new Error("No purchase found");
        console.log("Purchase Note ID:", purchase.note_id);

        console.log("4. Hitting API Direct (http://localhost:5001)...");
        try {
            const url = `http://localhost:5001/api/download/note/${purchase.note_id}`;
            console.log("URL:", url);
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("STATUS:", response.status);
            // console.log("DATA:", JSON.stringify(response.data, null, 2));
            console.log("Download URL generated successfully.");
        } catch (e: any) {
            console.error("API FAILURE:");
            if (e.response) {
                console.error("Status:", e.response.status);
                console.error("Data:", e.response.data);
            } else {
                console.error(e.message);
            }
        }

    } catch (err) {
        console.error("Script Error:", err);
    }
})();

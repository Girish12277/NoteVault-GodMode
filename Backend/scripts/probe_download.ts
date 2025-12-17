
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET || 'studyvault_access_secret_key_123';
const API_URL = 'http://localhost:5001/api';
// Use the Note ID from the user logs
const NOTE_ID = '205b73dc-f440-4e22-811c-e1b507a93443';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function probe() {
    console.log('1. Fetching Real User...');
    const user = await prisma.users.findFirst();
    if (!user) {
        console.error('No users found in DB!');
        return;
    }
    console.log(`User found: ${user.id}`);

    console.log('2. Generating Token...');
    const token = jwt.sign(
        { id: user.id, email: user.email, role: 'USER' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    console.log('Token generated.');

    console.log(`2. Probing Download: ${API_URL}/notes/${NOTE_ID}/download`);
    try {
        const res = await axios.get(`${API_URL}/notes/${NOTE_ID}/download`, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true // Don't throw on error
        });

        console.log('--- RESULT ---');
        console.log(`STATUS: ${res.status}`);
        console.log(`BODY: ${JSON.stringify(res.data)}`);
        console.log('--------------');

    } catch (err: any) {
        console.error('Probe Failed (Request Error):');
        if (err.response) {
            console.log(`STATUS: ${err.response.status}`);
            console.log(`BODY: ${JSON.stringify(err.response.data)}`);
        } else {
            console.log(err.message);
        }
    }
}

probe();

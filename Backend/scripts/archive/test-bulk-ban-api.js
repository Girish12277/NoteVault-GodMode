const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
    console.log('='.repeat(60));
    console.log('GOD-LEVEL API ENDPOINT VERIFICATION');
    console.log('='.repeat(60));
    console.log();

    let adminToken = null;
    const testUserIds = [
        '73b3106e-5af0-4a7b-a474-27cdeb09f442',  // Auth God Target
        'fa36385f-d0eb-495c-bd70-4a686cae4802',  // Auth God Target 2  
        'user_auto_0'                             // Dev Gupta
    ];

    // TEST 1: Admin Login
    console.log('TEST 1: Admin Login');
    console.log('-'.repeat(40));
    try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@studyvault.com',
            password: 'Test@123'
        });

        adminToken = loginResponse.data.token;
        console.log('✅ Login SUCCESS');
        console.log(`Token: ${adminToken.substring(0, 50)}...`);
        console.log(`User: ${loginResponse.data.user.fullName}`);
        console.log(`Admin: ${loginResponse.data.user.isAdmin}`);
    } catch (error) {
        console.log('❌ Login FAILED');
        console.log(`Error: ${error.response?.data?.message || error.message}`);
        process.exit(1);
    }
    console.log();

    // TEST 2: Bulk-Ban Without Auth
    console.log('TEST 2: Bulk-Ban Without Auth (Should Fail)');
    console.log('-'.repeat(40));
    try {
        await axios.post(`${BASE_URL}/admin/users/bulk-ban`, {
            userIds: testUserIds,
            reason: 'Test'
        });
        console.log('❌ UNEXPECTED SUCCESS');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Correctly rejected (401 Unauthorized)');
            console.log(`Message: ${error.response.data.message}`);
        } else {
            console.log(`❌ Wrong error: ${error.response?.status}`);
        }
    }
    console.log();

    // TEST 3: Bulk-Ban With Valid Auth and Valid Users
    console.log('TEST 3: Bulk-Ban With Valid Auth (3 users)');
    console.log('-'.repeat(40));
    try {
        const response = await axios.post(
            `${BASE_URL}/admin/users/bulk-ban`,
            {
                userIds: testUserIds,
                reason: 'GOD-LEVEL VERIFICATION TEST'
            },
            {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }
        );

        console.log('✅ BULK-BAN SUCCESS');
        console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
        console.log(`Suspended Count: ${response.data.data?.suspendedCount}`);
        console.log(`Total Requested: ${response.data.data?.totalRequested}`);
    } catch (error) {
        console.log('❌ BULK-BAN FAILED');
        console.log(`Status: ${error.response?.status}`);
        console.log(`Error: ${JSON.stringify(error.response?.data, null, 2)}`);
    }
    console.log();

    // TEST 4: Verify Users Were Suspended
    console.log('TEST 4: Verify Database State Change');
    console.log('-'.repeat(40));
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const suspendedUsers = await prisma.users.findMany({
        where: { id: { in: testUserIds } },
        select: { id: true, email: true, is_active: true }
    });

    console.log(`Checked Users:`);
    suspendedUsers.forEach(u => {
        const status = u.is_active ? '❌ STILL ACTIVE' : '✅ SUSPENDED';
        console.log(`  ${u.email}: ${status}`);
    });

    await prisma.$disconnect();
    console.log();

    // TEST 5: Empty Array Error
    console.log('TEST 5: Empty User Array (Should Fail)');
    console.log('-'.repeat(40));
    try {
        await axios.post(
            `${BASE_URL}/admin/users/bulk-ban`,
            { userIds: [], reason: 'Test' },
            { headers: { 'Authorization': `Bearer ${adminToken}` } }
        );
        console.log('❌ UNEXPECTED SUCCESS');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected (400 Bad Request)');
            console.log(`Message: ${error.response.data.message}`);
        } else {
            console.log(`❌ Wrong error: ${error.response?.status}`);
        }
    }
    console.log();

    // TEST 6: Too Many Users Error
    console.log('TEST 6: Too Many Users (>100, Should Fail)');
    console.log('-'.repeat(40));
    const tooManyUsers = Array(101).fill('fake-id');
    try {
        await axios.post(
            `${BASE_URL}/admin/users/bulk-ban`,
            { userIds: tooManyUsers, reason: 'Test' },
            { headers: { 'Authorization': `Bearer ${adminToken}` } }
        );
        console.log('❌ UNEXPECTED SUCCESS');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Correctly rejected (400 Bad Request)');
            console.log(`Message: ${error.response.data.message}`);
        } else {
            console.log(`❌ Wrong error: ${error.response?.status}`);
        }
    }
    console.log();

    console.log('='.repeat(60));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(60));
}

runTests();

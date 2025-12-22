// Authentication OTP Schema Migration - Supabase
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runAuthenticationMigration() {
    console.log('\n🔐 Authentication OTP Schema - Supabase Migration');
    console.log('='.repeat(50) + '\n');

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('📡 Connecting to Supabase...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'authentication_otps_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Executing authentication schema migration...\n');

        // Execute migration
        await client.query(sql);

        console.log('✅ Migration completed!\n');

        // Verify tables created
        console.log('📊 Verifying tables...');
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
              AND (tablename = 'email_otps' 
               OR tablename = 'mobile_otps')
            ORDER BY tablename;
        `);

        console.log(`\n✓ Created ${tablesResult.rows.length} OTP tables:`);
        tablesResult.rows.forEach(row => {
            console.log(`  • ${row.tablename}`);
        });

        // Verify user columns
        console.log('\n📊 Verifying user table columns...');
        const columnsResult = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
              AND column_name IN ('email_verified', 'email_verified_at', 
                                  'phone_verified', 'phone_verified_at', 
                                  'google_id', 'auth_provider')
            ORDER BY column_name;
        `);

        console.log(`\n✓ Added ${columnsResult.rows.length} verification columns:`);
        columnsResult.rows.forEach(row => {
            console.log(`  • users.${row.column_name}`);
        });

        // Count indexes
        const indexesResult = await client.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE schemaname = 'public' 
              AND (tablename = 'email_otps' OR tablename = 'mobile_otps' 
                   OR indexname LIKE 'idx_users_email_verified%'
                   OR indexname LIKE 'idx_users_phone_verified%'
                   OR indexname LIKE 'idx_users_google_id%')
            ORDER BY indexname;
        `);

        console.log(`\n✓ Created ${indexesResult.rows.length} indexes`);

        console.log('\n🎉 Authentication Schema - READY!');
        console.log('='.repeat(50) + '\n');

        // Summary
        console.log('📋 SUMMARY:');
        console.log(`  • Tables: ${tablesResult.rows.length}`);
        console.log(`  • User columns: ${columnsResult.rows.length}`);
        console.log(`  • Indexes: ${indexesResult.rows.length}`);
        console.log('\n✅ Phase 1 Complete - Database Schema Ready\n');

    } catch (error) {
        console.error('\n❌ Migration Error:', error.message);
        if (error.detail) console.error('Details:', error.detail);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runAuthenticationMigration();

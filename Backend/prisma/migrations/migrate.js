// Supabase Migration - Content Moderation Schema
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    console.log('\n🔧 Content Moderation - Supabase Migration');
    console.log('='.repeat(50) + '\n');

    // Database connection
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('📡 Connecting to Supabase...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, 'content_moderation_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Executing migration SQL...\n');

        // Execute migration
        await client.query(sql);

        console.log('✅ Migration completed!\n');

        // Verify tables
        console.log('📊 Verifying tables created...');
        const result = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
              AND (tablename LIKE '%moderation%' 
               OR tablename LIKE '%copyright%' 
               OR tablename LIKE '%deleted%')
            ORDER BY tablename;
        `);

        console.log(`\n✓ Created ${result.rows.length} tables:`);
        result.rows.forEach(row => {
            console.log(`  • ${row.tablename}`);
        });

        console.log('\n🎉 Content Moderation System - READY!');
        console.log('='.repeat(50) + '\n');

    } catch (error) {
        console.error('\n❌ Migration Error:', error.message);
        if (error.detail) console.error('Details:', error.detail);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();

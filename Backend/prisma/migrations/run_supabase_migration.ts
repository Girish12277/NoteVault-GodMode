// Supabase Migration Script
// Executes content_moderation_schema.sql on Supabase database

import { readFileSync } from 'fs';
import { join } from 'path';
import pkg from 'pg';
const { Client } = pkg;

async function runMigration() {
    console.log('🔧 Content Moderation - Supabase Migration\n');
    console.log('='.repeat(50));

    // Read database URL from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not found in environment');
        console.error('Please ensure .env file exists with DATABASE_URL');
        process.exit(1);
    }

    console.log('✓ Database URL found');
    console.log('✓ Connecting to Supabase...\n');

    // Create PostgreSQL client
    const client = new Client({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false // Supabase uses SSL
        }
    });

    try {
        // Connect to database
        await client.connect();
        console.log('✅ Connected to Supabase!\n');

        // Read migration file
        const migrationPath = join(__dirname, 'content_moderation_schema.sql');
        const sql = readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration file loaded');
        console.log('🚀 Executing migration...\n');

        // Execute migration
        await client.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // Verify tables created
        console.log('📊 Verifying tables...');
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
        result.rows.forEach((row: any) => {
            console.log(`  - ${row.tablename}`);
        });

        console.log('\n🎉 Content Moderation System - Database Ready!');
        console.log('='.repeat(50));

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nDetails:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run migration
runMigration().catch(console.error);

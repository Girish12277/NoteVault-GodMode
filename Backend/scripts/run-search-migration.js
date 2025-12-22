/**
 * Automated Search Migration Script
 * Executes god_level_search_setup.sql against your PostgreSQL database
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSearchMigration() {
    console.log('🚀 Starting PostgreSQL Search Migration...\n');

    // Verify DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
        console.error('❌ ERROR: DATABASE_URL not found in .env file');
        console.error('Please create .env file with DATABASE_URL');
        process.exit(1);
    }

    // Create PostgreSQL client
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // Connect to database
        console.log('📡 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');

        // Read SQL file
        const sqlPath = path.join(__dirname, '../prisma/migrations/god_level_search_setup.sql');
        console.log(`📄 Reading migration file: ${sqlPath}`);

        if (!fs.existsSync(sqlPath)) {
            throw new Error(`Migration file not found: ${sqlPath}`);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('✅ Migration file loaded\n');

        // Execute migration
        console.log('⚙️  Executing migration...');
        console.log('-----------------------------------');
        await client.query(sql);
        console.log('-----------------------------------');
        console.log('✅ Migration executed successfully!\n');

        // Verify extensions
        console.log('🔍 Verifying extensions...');
        const extensionsResult = await client.query(`
      SELECT extname FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent');
    `);

        const extensions = extensionsResult.rows.map(r => r.extname);
        console.log(`✅ Extensions installed: ${extensions.join(', ')}\n`);

        // Verify search_vector column
        console.log('🔍 Verifying search_vector column...');
        const columnResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notes' AND column_name = 'search_vector';
    `);

        if (columnResult.rows.length > 0) {
            console.log('✅ search_vector column exists\n');
        } else {
            console.warn('⚠️  search_vector column not found (may be using prisma model name)\n');
        }

        // Verify indexes
        console.log('🔍 Verifying indexes...');
        const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'notes' 
      AND indexname LIKE '%search%';
    `);

        console.log(`✅ Search indexes: ${indexResult.rows.length} found\n`);
        indexResult.rows.forEach(row => {
            console.log(`   - ${row.indexname}`);
        });

        console.log('\n🎉 MIGRATION COMPLETE!\n');
        console.log('Next steps:');
        console.log('1. Restart your backend server');
        console.log('2. Test autocomplete: curl "http://localhost:5001/api/search/autocomplete?q=eng"');
        console.log('3. Test search: curl "http://localhost:5001/api/search?q=engineering"');
        console.log('\n✅ God-Level Search System is now active!\n');

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:');
        console.error(error.message);
        console.error('\nError Details:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('📡 Database connection closed');
    }
}

// Run migration
runSearchMigration()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });

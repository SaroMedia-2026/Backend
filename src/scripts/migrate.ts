import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;

async function runMigration() {
  console.log('🚀 Running database migration on Supabase PostgreSQL...');

  const host = process.env.DB_HOST || '';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'postgres';

  if (!host || !password) {
    console.error('❌ DB_HOST and DB_PASSWORD environment variables are required for migration.');
    process.exit(1);
  }

  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Postgres database successfully.');

    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Migration file not found at: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📄 Executing migration SQL (${sql.length} bytes)...`);

    await client.query(sql);
    console.log('🎉 Migration 001_initial_schema.sql executed successfully!');

    // Verify created tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Public tables in database:');
    for (const row of tableRes.rows) {
      console.log(`   • public.${row.table_name}`);
    }
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    if (err.hint) console.error('   Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();

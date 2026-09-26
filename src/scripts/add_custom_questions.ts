import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function updateSchema() {
  console.log('🚀 Adding custom_questions to careers and answers to job_applications...');

  const host = process.env.DB_HOST || 'db.cexwuqkrstuqfmbqkwss.supabase.co';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'Saro@official@2026';
  const database = process.env.DB_NAME || 'postgres';

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
    console.log('✅ Connected to database.');

    await client.query(`
      ALTER TABLE public.careers 
      ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Added custom_questions to public.careers');

    await client.query(`
      ALTER TABLE public.job_applications 
      ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('✅ Added answers to public.job_applications');

    await client.end();
    console.log('🎉 Schema updated successfully!');
  } catch (err: any) {
    console.error('❌ Failed to update schema:', err.message);
    process.exit(1);
  }
}

updateSchema();

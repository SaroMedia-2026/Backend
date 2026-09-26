import { v2 as cloudinary } from 'cloudinary';
import { supabaseAnon, supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';

async function testConnections() {
  console.log('\n======================================================');
  console.log('🔍 Saro Agency Backend CMS - Connectivity Diagnostics');
  console.log('======================================================\n');

  let allPassed = true;

  // --- 1. Cloudinary Test ---
  console.log('1️⃣  CLOUDINARY CDN TEST');
  console.log('------------------------------------------------------');
  console.log(`• Cloud Name: ${env.CLOUDINARY_CLOUD_NAME}`);
  console.log(`• API Key:    ${env.CLOUDINARY_API_KEY ? '******' + env.CLOUDINARY_API_KEY.slice(-4) : 'MISSING'}`);

  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });

  try {
    const pingRes = await cloudinary.api.ping();
    console.log('✅ Cloudinary Connection: SUCCESS (Status: ok)');
    console.log(`   API Rate Limit Remaining: ${pingRes.rate_limit_remaining} / ${pingRes.rate_limit_allowed}`);
  } catch (err: any) {
    allPassed = false;
    console.error('❌ Cloudinary Connection: FAILED');
    console.error('   Error:', err?.message || err);
  }

  // --- 2. Supabase Anon Key Test ---
  console.log('\n2️⃣  SUPABASE PUBLISHABLE / ANON KEY TEST');
  console.log('------------------------------------------------------');
  console.log(`• Project URL: ${env.SUPABASE_URL}`);
  console.log(`• Anon Key:    ${env.SUPABASE_ANON_KEY.substring(0, 20)}...`);

  // --- 3. Supabase Service Role Key Test ---
  console.log('\n3️⃣  SUPABASE SERVICE ROLE KEY TEST');
  console.log('------------------------------------------------------');
  console.log(`• Service Role Key: ${env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);

  const isDuplicateKey = env.SUPABASE_SERVICE_ROLE_KEY === env.SUPABASE_ANON_KEY;
  if (isDuplicateKey) {
    allPassed = false;
    console.log('❌ MISCONFIGURATION DETECTED:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY is identical to SUPABASE_ANON_KEY!');
    console.log('   "sb_publishable_..." is a public key, not a secret admin key.');
    console.log('   Action needed: Go to Supabase Dashboard -> Project Settings -> API Keys');
    console.log('   Copy the "service_role" secret key (usually starts with "sb_secret_..." or "eyJ...")');
    console.log('   and paste it into SUPABASE_SERVICE_ROLE_KEY in backend/.env.');
  }

  try {
    const { data: usersData, error: adminAuthError } = await supabaseAdmin.auth.admin.listUsers();
    if (adminAuthError) {
      allPassed = false;
      console.log('❌ Admin Auth Access: FAILED');
      console.log(`   Error: ${adminAuthError.message}`);
    } else {
      console.log('✅ Service Role Auth: SUCCESS (Can manage auth users)');
      console.log(`   Total registered auth users: ${usersData?.users?.length || 0}`);
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ Admin Auth Access Exception:', err?.message || err);
  }

  // --- 4. Database Schema & Tables Test ---
  console.log('\n4️⃣  DATABASE SCHEMA & TABLES TEST');
  console.log('------------------------------------------------------');
  const tables = [
    'profiles',
    'client_logos',
    'testimonials',
    'portfolio_items',
    'portfolio_media',
    'careers',
    'job_applications',
    'contact_submissions',
    'site_settings',
  ];

  let missingTables = 0;
  for (const table of tables) {
    const { error } = await supabaseAnon.from(table).select('*').limit(1);
    if (error) {
      missingTables++;
      console.log(`❌ Table 'public.${table}': NOT FOUND (${error.message})`);
    } else {
      console.log(`✅ Table 'public.${table}': READY`);
    }
  }

  if (missingTables > 0) {
    allPassed = false;
    console.log(`\n⚠️  ${missingTables} tables are missing or not exposed in the schema cache.`);
    console.log('   Action needed: Open backend/supabase/migrations/001_initial_schema.sql,');
    console.log('   copy its content into Supabase Dashboard -> SQL Editor, and click RUN.');
  }

  console.log('\n======================================================');
  if (allPassed) {
    console.log('🎉 ALL CONNECTIONS AND TABLES ARE FULLY OPERATIONAL!');
  } else {
    console.log('⚠️  SOME CONFIGURATION STEPS ARE REQUIRED (See details above)');
  }
  console.log('======================================================\n');
}

testConnections();

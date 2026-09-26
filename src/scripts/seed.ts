import { runDatabaseSeed } from '../services/seed.service.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

async function main() {
  try {
    const result = await runDatabaseSeed();
    logger.info('\n🎉 Database Seeding completed successfully!');
    logger.info('====================================================');
    logger.info(`Admin Email:    ${result.adminEmail || env.SEED_ADMIN_EMAIL}`);
    logger.info(`Admin Password: ${env.SEED_ADMIN_PASSWORD}`);
    logger.info('====================================================');
  } catch (err: any) {
    logger.error('❌ Seeding failed:', err.message);
    if (err.message.includes('schema cache')) {
      logger.error('👉 Open Supabase SQL Editor: https://supabase.com/dashboard/project/fprbtqmhqfjgqenkgygz/sql/new');
      logger.error('👉 Copy & run: backend/supabase/migrations/001_initial_schema.sql');
    }
    process.exit(1);
  }
}

main();

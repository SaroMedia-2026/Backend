import { runDatabaseSeed } from '../services/seed.service.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    await runDatabaseSeed();
    logger.info('\n🎉 Database Seeding completed successfully!');
    logger.info('====================================================');
    logger.info('CMS database ready. Authenticate using configured administrator accounts.');
    logger.info('====================================================');
  } catch (err: any) {
    logger.error('❌ Seeding failed:', err.message);
    if (err.message.includes('schema cache')) {
      logger.error('👉 Run backend/supabase/migrations/001_initial_schema.sql in the Supabase SQL editor.');
    }
    process.exit(1);
  }
}

main();

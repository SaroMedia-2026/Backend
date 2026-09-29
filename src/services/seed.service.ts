import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface SeedResult {
  success: boolean;
  message: string;
}

export async function runDatabaseSeed(): Promise<SeedResult> {
  logger.info('Verifying database initialization...');

  if (!env.SUPABASE_URL) {
    throw new Error('Supabase credentials are missing in .env file.');
  }

  // Pre-check if tables exist in Supabase
  const { error: testTableError } = await supabaseAdmin.from('profiles').select('id').limit(1);
  if (testTableError && testTableError.message.includes('schema cache')) {
    throw new Error(
      'Database tables have not been created yet in Supabase! Please run schema migration in the Supabase SQL editor first.'
    );
  }

  // Ensure default site_settings record exists if empty
  const { data: existingSettings } = await supabaseAdmin.from('site_settings').select('id').limit(1);
  if (!existingSettings || existingSettings.length === 0) {
    await supabaseAdmin.from('site_settings').insert([
      {
        hero_headline: 'Transforming Brands Into Digital Legacies',
        hero_subheadline:
          'We craft compelling digital experiences, high-converting campaigns, and visual stories that elevate your brand.',
        hero_cta_text: 'Explore Our Work',
        hero_cta_link: '/work',
        meta_title: 'Saro Media | Digital Marketing & Creative Production',
        meta_description:
          'Digital marketing, brand strategy, videography, and web design agency.',
        contact_email: 'hello@saromedia.com.np',
        contact_phone: '+977 9800000000',
        social_links: {
          instagram: 'https://instagram.com',
          facebook: 'https://facebook.com',
          linkedin: 'https://linkedin.com',
          youtube: 'https://youtube.com',
        },
      },
    ]);
  }

  return {
    success: true,
    message: 'Database verified and ready.',
  };
}

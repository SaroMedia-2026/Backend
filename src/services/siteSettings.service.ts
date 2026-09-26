import { supabaseAdmin } from '../config/supabase.js';
import { SiteSettings } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';

export class SiteSettingsService {
  static async getSettings(): Promise<SiteSettings> {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      // If table is empty, return default placeholder
      if (error.code === 'PGRST116') {
        const defaultSettings: Partial<SiteSettings> = {
          hero_headline: 'Transforming Brands Into Digital Legacies',
          hero_subheadline:
            'We craft compelling digital experiences, high-converting campaigns, and visual stories that elevate your brand.',
          hero_cta_text: 'Explore Our Work',
          hero_cta_link: '/portfolio',
          meta_title: 'Saro Agency | Digital Marketing & Creative Production',
          meta_description:
            'Award-winning digital marketing, brand strategy, videography, and web design agency.',
          contact_email: 'hello@saroagency.com',
          contact_phone: '+1 (555) 234-5678',
          social_links: {
            instagram: 'https://instagram.com',
            linkedin: 'https://linkedin.com',
            twitter: 'https://twitter.com',
          },
        };

        const { data: created, error: createError } = await supabaseAdmin
          .from('site_settings')
          .insert([defaultSettings])
          .select()
          .single();

        if (createError) {
          throw ApiError.internal(`Failed to initialize site settings: ${createError.message}`);
        }
        return created;
      }
      throw ApiError.internal(`Failed to fetch site settings: ${error.message}`);
    }

    return data;
  }

  static async updateSettings(payload: Partial<SiteSettings>): Promise<SiteSettings> {
    const current = await this.getSettings();

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .update(payload)
      .eq('id', current.id)
      .select()
      .single();

    if (error) throw ApiError.internal(`Failed to update site settings: ${error.message}`);
    return data;
  }
}

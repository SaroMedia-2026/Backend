import { z } from 'zod';

export const updateSiteSettingsSchema = z.object({
  hero_headline: z.string().min(1, 'Hero headline cannot be empty').optional(),
  hero_subheadline: z.string().min(1, 'Hero subheadline cannot be empty').optional(),
  hero_cta_text: z.string().min(1).optional(),
  hero_cta_link: z.string().min(1).optional(),
  meta_title: z.string().max(200).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  contact_phone: z.string().max(50).nullable().optional(),
  social_links: z.record(z.string()).optional(),
});

import { z } from 'zod';

export const createClientLogoSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(150),
  logo_url: z.string().url('A valid logo URL is required'),
  cloudinary_public_id: z.string().min(1, 'Cloudinary public_id is required'),
  website_link: z.string().url('Invalid website link').nullable().optional(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const updateClientLogoSchema = createClientLogoSchema.partial();

export const reorderClientLogosSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid('Invalid ID format'),
      display_order: z.number().int(),
    })
  ).min(1, 'At least one item is required for reordering'),
});

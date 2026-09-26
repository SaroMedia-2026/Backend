import { z } from 'zod';

export const portfolioMediaItemSchema = z.object({
  public_id: z.string().min(1, 'Public ID is required'),
  url: z.string().url('A valid URL is required'),
  resource_type: z.enum(['image', 'video']).default('image'),
  caption: z.string().max(255).nullable().optional(),
  display_order: z.number().int().default(0),
});

export const createPortfolioItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
  client: z.string().max(150).nullable().optional(),
  category: z.string().min(1, 'Category is required'),
  description: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  cover_image_url: z.string().url('A valid cover image URL is required'),
  cover_image_public_id: z.string().min(1, 'Cover image public ID is required'),
  media_type: z.enum(['image', 'video']).default('image'),
  tags: z.array(z.string()).default([]),
  status: z.enum(['published', 'draft', 'featured']).default('published'),
  display_order: z.number().int().default(0),
  media: z.array(portfolioMediaItemSchema).optional(),
});

export const updatePortfolioItemSchema = createPortfolioItemSchema.partial();

export const addPortfolioMediaSchema = z.object({
  media: z.array(portfolioMediaItemSchema).min(1, 'At least one media item is required'),
});

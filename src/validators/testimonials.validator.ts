import { z } from 'zod';

export const createTestimonialSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(150),
  company: z.string().max(150).nullable().optional(),
  photo_url: z.string().url('Invalid photo URL').nullable().optional(),
  cloudinary_public_id: z.string().nullable().optional(),
  testimonial_text: z.string().min(5, 'Testimonial text must be at least 5 characters'),
  rating: z.number().int().min(1).max(5).default(5),
  published: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

export const reorderTestimonialsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().int(),
    })
  ).min(1, 'Items required'),
});

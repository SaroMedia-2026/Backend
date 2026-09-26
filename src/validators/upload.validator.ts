import { z } from 'zod';

export const uploadQuerySchema = z.object({
  folder: z.string().optional(),
  resource_type: z.enum(['image', 'video', 'raw', 'auto']).optional(),
});

import { z } from 'zod';

export const createContactSubmissionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  email: z.string().email('A valid email address is required'),
  phone: z.string().max(50).nullable().optional(),
  subject: z.string().max(200).nullable().optional(),
  message: z.string().min(5, 'Message must be at least 5 characters').max(5000),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived']),
  notes: z.string().nullable().optional(),
});

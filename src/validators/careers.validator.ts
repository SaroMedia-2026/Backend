import { z } from 'zod';

export const createCareerSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  type: z.enum(['full-time', 'part-time', 'contract', 'remote', 'internship']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.array(z.string()).default([]),
  deadline: z.string().datetime().nullable().optional(),
  status: z.enum(['open', 'closed', 'draft']).default('open'),
  custom_questions: z.array(z.any()).optional().nullable(),
});

export const updateCareerSchema = createCareerSchema.partial();

export const applyJobSchema = z.object({
  name: z.string().min(1, 'Applicant name is required').max(150),
  email: z.string().email('A valid email address is required'),
  phone: z.string().max(50).nullable().optional(),
  cover_letter: z.string().max(5000).nullable().optional(),
  answers: z.any().optional().nullable(),
  // resume_url and resume_public_id can be provided directly or populated via multer file upload
  resume_url: z.string().url().optional(),
  resume_public_id: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['new', 'reviewed', 'shortlisted', 'rejected', 'hired']),
  notes: z.string().nullable().optional(),
});

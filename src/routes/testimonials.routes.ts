import { Router } from 'express';
import { TestimonialsController } from '../controllers/testimonials.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middleware/cache.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  reorderTestimonialsSchema,
} from '../validators/testimonials.validator.js';

const router = Router();

// Public: GET /api/v1/testimonials (cached for 60s for public visitors)
router.get('/', optionalAuth, cacheResponse(60), TestimonialsController.getAll);
router.get('/:id', TestimonialsController.getById);

// Protected: Admin only
router.post(
  '/',
  authenticate,
  requireAdmin,
  invalidateCache('testimonials'),
  validate({ body: createTestimonialSchema }),
  TestimonialsController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  invalidateCache('testimonials'),
  validate({ body: updateTestimonialSchema }),
  TestimonialsController.update
);

router.delete('/:id', authenticate, requireAdmin, invalidateCache('testimonials'), TestimonialsController.delete);

router.post(
  '/reorder',
  authenticate,
  requireAdmin,
  invalidateCache('testimonials'),
  validate({ body: reorderTestimonialsSchema }),
  TestimonialsController.reorder
);

export default router;

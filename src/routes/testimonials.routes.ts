import { Router } from 'express';
import { TestimonialsController } from '../controllers/testimonials.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
  reorderTestimonialsSchema,
} from '../validators/testimonials.validator.js';

const router = Router();

// Public: GET /api/v1/testimonials (published only) or Admin with ?all=true
router.get('/', optionalAuth, TestimonialsController.getAll);
router.get('/:id', TestimonialsController.getById);

// Protected: Admin only
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createTestimonialSchema }),
  TestimonialsController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updateTestimonialSchema }),
  TestimonialsController.update
);

router.delete('/:id', authenticate, requireAdmin, TestimonialsController.delete);

router.post(
  '/reorder',
  authenticate,
  requireAdmin,
  validate({ body: reorderTestimonialsSchema }),
  TestimonialsController.reorder
);

export default router;

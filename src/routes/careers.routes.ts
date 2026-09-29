import { Router } from 'express';
import { CareersController } from '../controllers/careers.controller.js';
import { authenticate, optionalAuth, requireAdmin, requireStaff } from '../middleware/auth.middleware.js';
import { resumeUpload } from '../middleware/upload.middleware.js';
import { submissionLimiter } from '../middleware/rateLimiter.middleware.js';
import { preventDuplicateSubmission } from '../middleware/timeout.middleware.js';
import { cacheResponse, invalidateCache } from '../middleware/cache.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createCareerSchema,
  updateCareerSchema,
  updateApplicationStatusSchema,
} from '../validators/careers.validator.js';

const router = Router();

// ==============================================================================
// 1. Applications Routes (Staff / Admin Protected) - Place before /:id param
// ==============================================================================
router.get('/applications/all', authenticate, requireStaff, CareersController.getApplications);
router.get('/applications/:id', authenticate, requireStaff, CareersController.getApplicationById);
router.patch(
  '/applications/:id',
  authenticate,
  requireStaff,
  validate({ body: updateApplicationStatusSchema }),
  CareersController.updateApplicationStatus
);
router.delete('/applications/:id', authenticate, requireAdmin, CareersController.deleteApplication);

// ==============================================================================
// 2. Career Listings Routes
// ==============================================================================

// Public: GET /api/v1/careers (open only, cached 60s) or Admin with ?all=true
router.get('/', optionalAuth, cacheResponse(60), CareersController.getCareers);

// Public: GET /api/v1/careers/:id (cached 60s)
router.get('/:id', cacheResponse(60), CareersController.getCareerById);

// Public: POST /api/v1/careers/:id/apply (multipart form with 'resume' file or JSON)
router.post(
  '/:id/apply',
  submissionLimiter,
  preventDuplicateSubmission(15000),
  resumeUpload.single('resume'),
  CareersController.apply
);

// Protected: Admin manage career listings
router.post(
  '/',
  authenticate,
  requireAdmin,
  invalidateCache('careers'),
  validate({ body: createCareerSchema }),
  CareersController.createCareer
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  invalidateCache('careers'),
  validate({ body: updateCareerSchema }),
  CareersController.updateCareer
);

router.delete('/:id', authenticate, requireAdmin, invalidateCache('careers'), CareersController.deleteCareer);

export default router;

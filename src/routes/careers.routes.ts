import { Router } from 'express';
import { CareersController } from '../controllers/careers.controller.js';
import { authenticate, optionalAuth, requireAdmin, requireStaff } from '../middleware/auth.middleware.js';
import { resumeUpload } from '../middleware/upload.middleware.js';
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

// Public: GET /api/v1/careers (open only) or Admin with ?all=true
router.get('/', optionalAuth, CareersController.getCareers);

// Public: GET /api/v1/careers/:id
router.get('/:id', CareersController.getCareerById);

// Public: POST /api/v1/careers/:id/apply (multipart form with 'resume' file or JSON)
router.post(
  '/:id/apply',
  resumeUpload.single('resume'),
  CareersController.apply
);

// Protected: Admin manage career listings
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createCareerSchema }),
  CareersController.createCareer
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updateCareerSchema }),
  CareersController.updateCareer
);

router.delete('/:id', authenticate, requireAdmin, CareersController.deleteCareer);

export default router;

import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  addPortfolioMediaSchema,
} from '../validators/portfolio.validator.js';

const router = Router();

// Public: GET /api/v1/portfolio (published/featured only, filterable)
router.get('/', optionalAuth, PortfolioController.getItems);

// Public: GET /api/v1/portfolio/slug/:slug
router.get('/slug/:slug', optionalAuth, PortfolioController.getBySlug);

// Protected: Admin get by UUID
router.get('/:id', authenticate, PortfolioController.getById);

// Protected: Admin create portfolio item
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createPortfolioItemSchema }),
  PortfolioController.create
);

// Protected: Admin update portfolio item
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updatePortfolioItemSchema }),
  PortfolioController.update
);

// Protected: Admin delete portfolio item (cascade deletes Cloudinary assets)
router.delete('/:id', authenticate, requireAdmin, PortfolioController.delete);

// Protected: Admin attach media items to portfolio gallery
router.post(
  '/:id/media',
  authenticate,
  requireAdmin,
  validate({ body: addPortfolioMediaSchema }),
  PortfolioController.addMedia
);

// Protected: Admin delete media item
router.delete('/media/:mediaId', authenticate, requireAdmin, PortfolioController.deleteMedia);

export default router;

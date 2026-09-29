import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middleware/cache.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  addPortfolioMediaSchema,
} from '../validators/portfolio.validator.js';

const router = Router();

// Public: GET /api/v1/portfolio (cached 60s for public visitors, published/featured filterable)
router.get('/', optionalAuth, cacheResponse(60), PortfolioController.getItems);

// Public: GET /api/v1/portfolio/slug/:slug
router.get('/slug/:slug', optionalAuth, cacheResponse(60), PortfolioController.getBySlug);

// Public or Admin get by UUID or slug
router.get('/:id', optionalAuth, cacheResponse(60), PortfolioController.getById);

// Protected: Admin create portfolio item
router.post(
  '/',
  authenticate,
  requireAdmin,
  invalidateCache('portfolio'),
  validate({ body: createPortfolioItemSchema }),
  PortfolioController.create
);

// Protected: Admin update portfolio item
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  invalidateCache('portfolio'),
  validate({ body: updatePortfolioItemSchema }),
  PortfolioController.update
);

// Protected: Admin delete portfolio item (cascade deletes Cloudinary assets)
router.delete('/:id', authenticate, requireAdmin, invalidateCache('portfolio'), PortfolioController.delete);

// Protected: Admin attach media items to portfolio gallery
router.post(
  '/:id/media',
  authenticate,
  requireAdmin,
  invalidateCache('portfolio'),
  validate({ body: addPortfolioMediaSchema }),
  PortfolioController.addMedia
);

// Protected: Admin delete media item
router.delete('/media/:mediaId', authenticate, requireAdmin, invalidateCache('portfolio'), PortfolioController.deleteMedia);

export default router;

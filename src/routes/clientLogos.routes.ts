import { Router } from 'express';
import { ClientLogosController } from '../controllers/clientLogos.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middleware/cache.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createClientLogoSchema,
  updateClientLogoSchema,
  reorderClientLogosSchema,
} from '../validators/clientLogos.validator.js';

const router = Router();

// Public: GET /api/v1/client-logos (cached for 60s for public visitors)
router.get('/', optionalAuth, cacheResponse(60), ClientLogosController.getAll);
router.get('/:id', ClientLogosController.getById);

// Protected: Admin only
router.post(
  '/',
  authenticate,
  requireAdmin,
  invalidateCache('client-logos'),
  validate({ body: createClientLogoSchema }),
  ClientLogosController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  invalidateCache('client-logos'),
  validate({ body: updateClientLogoSchema }),
  ClientLogosController.update
);

router.delete('/:id', authenticate, requireAdmin, invalidateCache('client-logos'), ClientLogosController.delete);

router.post(
  '/reorder',
  authenticate,
  requireAdmin,
  invalidateCache('client-logos'),
  validate({ body: reorderClientLogosSchema }),
  ClientLogosController.reorder
);

export default router;

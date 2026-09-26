import { Router } from 'express';
import { ClientLogosController } from '../controllers/clientLogos.controller.js';
import { authenticate, optionalAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createClientLogoSchema,
  updateClientLogoSchema,
  reorderClientLogosSchema,
} from '../validators/clientLogos.validator.js';

const router = Router();

// Public: GET /api/v1/client-logos (active only) or Admin with ?all=true
router.get('/', optionalAuth, ClientLogosController.getAll);
router.get('/:id', ClientLogosController.getById);

// Protected: Admin only
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: createClientLogoSchema }),
  ClientLogosController.create
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ body: updateClientLogoSchema }),
  ClientLogosController.update
);

router.delete('/:id', authenticate, requireAdmin, ClientLogosController.delete);

router.post(
  '/reorder',
  authenticate,
  requireAdmin,
  validate({ body: reorderClientLogosSchema }),
  ClientLogosController.reorder
);

export default router;

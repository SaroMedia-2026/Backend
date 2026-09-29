import { Router } from 'express';
import { SiteSettingsController } from '../controllers/siteSettings.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { cacheResponse, invalidateCache } from '../middleware/cache.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateSiteSettingsSchema } from '../validators/siteSettings.validator.js';

const router = Router();

// Public: GET site settings (cached for 120s)
router.get('/', cacheResponse(120), SiteSettingsController.getSettings);

// Protected: Admin update site settings
router.put(
  '/',
  authenticate,
  requireAdmin,
  invalidateCache('site-settings'),
  validate({ body: updateSiteSettingsSchema }),
  SiteSettingsController.updateSettings
);

export default router;

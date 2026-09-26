import { Router } from 'express';
import { SiteSettingsController } from '../controllers/siteSettings.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateSiteSettingsSchema } from '../validators/siteSettings.validator.js';

const router = Router();

// Public: GET site settings (hero, branding, contacts, social links)
router.get('/', SiteSettingsController.getSettings);

// Protected: Admin update site settings
router.put(
  '/',
  authenticate,
  requireAdmin,
  validate({ body: updateSiteSettingsSchema }),
  SiteSettingsController.updateSettings
);

export default router;

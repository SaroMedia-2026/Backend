import { Router } from 'express';
import authRoutes from './auth.routes.js';
import clientLogosRoutes from './clientLogos.routes.js';
import testimonialsRoutes from './testimonials.routes.js';
import portfolioRoutes from './portfolio.routes.js';
import careersRoutes from './careers.routes.js';
import contactsRoutes from './contacts.routes.js';
import siteSettingsRoutes from './siteSettings.routes.js';
import analyticsRoutes from './analytics.routes.js';
import uploadRoutes from './upload.routes.js';
import systemRoutes from './system.routes.js';
import { CareersController } from '../controllers/careers.controller.js';
import { ContactsController } from '../controllers/contacts.controller.js';
import { authenticate, requireStaff, requireAdmin } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { submissionLimiter } from '../middleware/rateLimiter.middleware.js';
import { preventDuplicateSubmission } from '../middleware/timeout.middleware.js';
import { createContactSubmissionSchema, updateContactStatusSchema } from '../validators/contacts.validator.js';
import { updateApplicationStatusSchema } from '../validators/careers.validator.js';

const apiV1Router = Router();

// Root health, uptime, and system telemetry
apiV1Router.get('/health', (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const memory = process.memoryUsage();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Saro Agency Backend CMS API',
    uptime: {
      seconds: uptimeSeconds,
      formatted: `${hours}h ${minutes}m ${seconds}s`,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryMb: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
        rss: Math.round(memory.rss / 1024 / 1024 * 100) / 100,
      },
    },
  });
});

// Domain Routes
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/client-logos', clientLogosRoutes);
apiV1Router.use('/testimonials', testimonialsRoutes);
apiV1Router.use('/portfolio', portfolioRoutes);
apiV1Router.use('/careers', careersRoutes);
apiV1Router.use('/contacts', contactsRoutes);
apiV1Router.use('/site-settings', siteSettingsRoutes);
apiV1Router.use('/analytics', analyticsRoutes);
apiV1Router.use('/upload', uploadRoutes);
apiV1Router.use('/system', systemRoutes);

// Direct Aliases matching prompt specifications:
// 1. POST /api/v1/contact (singular alias for contact form submission)
apiV1Router.post(
  '/contact',
  submissionLimiter,
  preventDuplicateSubmission(15000),
  validate({ body: createContactSubmissionSchema }),
  ContactsController.submit
);

// 2. Direct /api/v1/applications routes (alias to CareersController applications)
apiV1Router.get('/applications', authenticate, requireStaff, CareersController.getApplications);
apiV1Router.get('/applications/:id', authenticate, requireStaff, CareersController.getApplicationById);
apiV1Router.patch(
  '/applications/:id',
  authenticate,
  requireStaff,
  validate({ body: updateApplicationStatusSchema }),
  CareersController.updateApplicationStatus
);
apiV1Router.delete('/applications/:id', authenticate, requireAdmin, CareersController.deleteApplication);

export default apiV1Router;

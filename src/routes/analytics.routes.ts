import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';
import { authenticate, requireStaff } from '../middleware/auth.middleware.js';

const router = Router();

// Protected: GET /api/v1/analytics/summary (Staff / Admin)
router.get('/summary', authenticate, requireStaff, AnalyticsController.getSummary);

export default router;

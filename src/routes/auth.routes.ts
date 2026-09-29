import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Public: Login endpoint protected by strict brute-force rate limiter
router.post('/login', authLimiter, AuthController.login);
router.post('/logout', AuthController.logout);

// Protected: Current user profile
router.get('/me', authenticate, AuthController.getMe);
router.patch('/profile', authenticate, AuthController.updateProfile);

export default router;

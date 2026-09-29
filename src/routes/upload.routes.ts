import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller.js';
import { authenticate, requireStaff, requireAdmin } from '../middleware/auth.middleware.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.middleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Protected: Staff/Admin single file upload
// Accepts multipart file under field 'file'
router.post(
  '/',
  authenticate,
  requireStaff,
  uploadLimiter,
  uploadSingle('file'),
  UploadController.uploadSingle
);

// Protected: Staff/Admin batch file upload
// Accepts multipart files under field 'files'
router.post(
  '/multiple',
  authenticate,
  requireStaff,
  uploadLimiter,
  uploadMultiple('files', 10),
  UploadController.uploadMultiple
);

// Protected: Admin delete asset from Cloudinary
router.delete(
  '/',
  authenticate,
  requireAdmin,
  UploadController.deleteAsset
);

export default router;

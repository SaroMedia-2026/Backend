import { Router } from 'express';
import { ContactsController } from '../controllers/contacts.controller.js';
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { submissionLimiter } from '../middleware/rateLimiter.middleware.js';
import { preventDuplicateSubmission } from '../middleware/timeout.middleware.js';
import {
  createContactSubmissionSchema,
  updateContactStatusSchema,
} from '../validators/contacts.validator.js';

const router = Router();

// Public: Submit contact form (with rate limit and duplicate submission prevention)
router.post(
  '/',
  submissionLimiter,
  preventDuplicateSubmission(15000),
  validate({ body: createContactSubmissionSchema }),
  ContactsController.submit
);

// Protected: Staff view submissions
router.get('/', authenticate, requireStaff, ContactsController.getAll);
router.get('/:id', authenticate, requireStaff, ContactsController.getById);

// Protected: Update lead status & notes
router.patch(
  '/:id',
  authenticate,
  requireStaff,
  validate({ body: updateContactStatusSchema }),
  ContactsController.updateStatus
);

// Protected: Admin delete submission
router.delete('/:id', authenticate, requireAdmin, ContactsController.delete);

export default router;

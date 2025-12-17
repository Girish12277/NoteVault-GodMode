import { Router } from 'express';
import { contactController } from '../controllers/contactController';

const router = Router();

import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, validateQuery, validateParams, schemas } from '../middleware/validation';
import Joi from 'joi';

// Public Route
router.post('/', validate(schemas.createInquiry), contactController.submit as any);

// Admin Routes
router.get('/', authenticate, requireAdmin, contactController.list as any);
router.patch('/:id/status', authenticate, requireAdmin, validate(schemas.updateInquiryStatus), contactController.updateStatus as any);
router.delete('/:id', authenticate, requireAdmin, contactController.delete as any);

export default router;

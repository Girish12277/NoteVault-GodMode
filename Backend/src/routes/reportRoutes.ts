import express from 'express';
import { reportController } from '../controllers/reportController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = express.Router();

router.post('/', authenticate, reportController.create);
router.get('/', authenticate, requireAdmin, reportController.list);
router.put('/:id', authenticate, requireAdmin, reportController.updateStatus);

export default router;

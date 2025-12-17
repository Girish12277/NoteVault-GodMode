import express from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';
import { validateQuery, validateParams, schemas } from '../middleware/validation';

const router = express.Router();

router.get('/', authenticate, validateQuery(schemas.notificationListQuery), notificationController.list);
router.get('/:id', authenticate, validateParams(schemas.notificationParams), notificationController.getById);
router.put('/read-all', authenticate, notificationController.markAllRead);
router.put('/:id/read', authenticate, validateParams(schemas.notificationParams), notificationController.markRead);
router.delete('/', authenticate, notificationController.clearAll);

export default router;

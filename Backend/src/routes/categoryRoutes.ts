import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', categoryController.list);
router.get('/:id', categoryController.getById);

// Admin routes
router.post('/', authenticate, requireAdmin, validate(schemas.createCategory), categoryController.create);
router.put('/:id', authenticate, requireAdmin, categoryController.update);
router.delete('/:id', authenticate, requireAdmin, categoryController.delete);

export default router;

import { Router } from 'express';
import { universityController } from '../controllers/universityController';

const router = Router();

router.get('/', universityController.list);
router.get('/:id', universityController.getById);

export default router;


import { Router } from 'express';
import { couponController } from '../controllers/couponController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/validate', authenticate, couponController.validate);

export default router;

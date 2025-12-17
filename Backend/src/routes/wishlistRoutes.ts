import express from 'express';
import { wishlistController } from '../controllers/wishlistController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/:noteId', authenticate, wishlistController.toggle);
router.get('/', authenticate, wishlistController.list);

export default router;

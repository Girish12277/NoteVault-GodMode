import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public - Get reviews for a note
router.get('/:noteId', reviewController.list);

// Protected - Create a review (must have purchased the note)
router.post('/:noteId', authenticate, validate(schemas.createReview), reviewController.create);

export default router;

import { Router } from 'express';
import { noteController } from '../controllers/noteController';
import { authenticate, requireSeller, optionalAuthenticate } from '../middleware/auth';
import { validate, validateQuery, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', optionalAuthenticate, validateQuery(schemas.searchQuery), noteController.list);
router.get('/:id', optionalAuthenticate, noteController.getById);
router.get('/:id/download', authenticate, noteController.download);

import { uploadNoteFields } from '../middleware/upload';

// Protected routes (require authentication)
// Validation must run AFTER upload middleware because multer populates req.body
router.post('/', authenticate, requireSeller, uploadNoteFields, validate(schemas.createNote), noteController.create);
router.put('/:id', authenticate, requireSeller, validate(schemas.updateNote), noteController.update);
router.delete('/:id', authenticate, requireSeller, noteController.delete);

export default router;

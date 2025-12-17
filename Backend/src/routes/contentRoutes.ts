import express from 'express';
import { getContent, updateContent } from '../controllers/contentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public read access
router.get('/:section', getContent);

// Admin-only write access
router.put('/:section', authenticate, requireAdmin, updateContent);

export default router;

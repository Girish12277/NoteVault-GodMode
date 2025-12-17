import express from 'express';
import { downloadController } from '../controllers/downloadController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * Download Routes
 * All routes require authentication
 */

// GET /api/download/note/:id - Stream PDF directly through backend
router.get('/note/:id', authenticate, downloadController.streamNoteDownload);

export default router;

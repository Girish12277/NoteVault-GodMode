import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { validateQuery, schemas } from '../middleware/validation';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

// Search with query parameter validation and rate limiting
router.get('/', searchLimiter, validateQuery(schemas.searchQuery), searchController.search);

export default router;

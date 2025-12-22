import { Router } from 'express';
import { searchController } from '../controllers/searchController';
import { validateQuery, schemas } from '../middleware/validation';
import { searchLimiter } from '../middleware/rateLimiter';

const router = Router();

// Main search with filters
router.get('/',
    searchLimiter,
    validateQuery(schemas.searchQuery),
    searchController.search
);

// Autocomplete suggestions
router.get('/autocomplete',
    searchLimiter,
    searchController.autocomplete
);

// Get search facets (subjects, universities)
router.get('/facets',
    searchController.facets
);

export default router;

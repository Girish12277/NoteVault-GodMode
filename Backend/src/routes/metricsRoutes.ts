import { Router } from 'express';
import { metricsController } from '../controllers/metricsController';

const router = Router();

/**
 * Metrics Routes (Enhancement #11)
 * 
 * These endpoints should NOT require authentication
 * (Used by Prometheus, monitoring systems)
 */

// Prometheus-compatible metrics
router.get('/', metricsController.prometheus);

// JSON format metrics
router.get('/json', metricsController.json);

export default router;

import { Router } from 'express';
import { healthController } from '../controllers/healthController';

const router = Router();

/**
 * Health Check Routes (Enhancement #7)
 * 
 * These endpoints should NOT require authentication
 * (Used by load balancers, Kubernetes, monitoring systems)
 */

// Basic health check
router.get('/', healthController.basic);

// Kubernetes-style health check
router.get('/healthz', healthController.kubernetes);

// Comprehensive health check with all subsystems
router.get('/detailed', healthController.detailed);

// Kubernetes readiness probe
router.get('/ready', healthController.ready);

// Kubernetes liveness probe
router.get('/live', healthController.live);

export default router;

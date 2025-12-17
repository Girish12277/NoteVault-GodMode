import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes (with rate limiting)
router.post('/register', authLimiter, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(schemas.resetPassword), authController.resetPassword);
router.post('/logout', authController.logout);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/become-seller', authenticate, authController.becomeSeller);

export default router;

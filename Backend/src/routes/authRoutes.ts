import { Router } from 'express';
import { authController } from '../controllers/authController';
import { otpController } from '../controllers/otpController';
import { oauthController } from '../controllers/oauthController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';
import rateLimit from 'express-rate-limit';

const router = Router();

// ========================================
// RATE LIMITERS
// ========================================

// OTP rate limiter (3 requests per hour)
const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many OTP requests. Please try again in 1 hour.',
    standardHeaders: true,
    legacyHeaders: false
});

// ========================================
// EMAIL/PASSWORD AUTHENTICATION (Original)
// ========================================

router.post('/register', authLimiter, validate(schemas.register), authController.register);
router.post('/login', authLimiter, validate(schemas.login), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, validate(schemas.forgotPassword), authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, validate(schemas.resetPassword), authController.resetPassword);
router.post('/logout', authController.logout);

// ========================================
// EMAIL OTP AUTHENTICATION (New)
// ========================================

router.post('/send-email-otp', otpLimiter, otpController.sendEmailOTP);
router.post('/verify-email-otp', otpLimiter, otpController.verifyEmailOTP);
router.post('/resend-email-otp', otpLimiter, otpController.resendEmailOTP);

// ========================================
// MOBILE OTP AUTHENTICATION (New)
// ========================================

router.post('/send-mobile-otp', otpLimiter, otpController.sendMobileOTP);
router.post('/verify-mobile-otp', otpLimiter, otpController.verifyMobileOTP);
router.post('/resend-mobile-otp', otpLimiter, otpController.resendMobileOTP);
router.post('/register-with-phone', otpLimiter, otpController.registerWithPhone);
router.post('/login-with-phone', otpLimiter, otpController.loginWithPhone);

// ========================================
// GOOGLE OAUTH AUTHENTICATION (New)
// ========================================

router.get('/google', oauthController.googleAuth);
router.get('/google/callback', oauthController.googleCallback);
router.post('/google/link', authenticate, oauthController.linkGoogle);
router.post('/google/unlink', authenticate, oauthController.unlinkGoogle);

// ========================================
// PROTECTED ROUTES (Require Authentication)
// ========================================

router.get('/me', authenticate, authController.getMe);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/become-seller', authenticate, authController.becomeSeller);

export default router;


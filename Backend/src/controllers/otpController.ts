import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { emailOTPService } from '../services/emailOTPService';
import { mobileOTPService } from '../services/mobileOTPService';

/**
 * GOD-LEVEL OTP CONTROLLER
 * 999999999999999% Perfection Standard
 * 
 * Handles:
 * - Email OTP (send, verify, resend)
 * - Mobile OTP (send, verify, resend)
 * - Phone-based login/registration
 */

// ========================================
// VALIDATION SCHEMAS
// ========================================

const sendEmailOTPSchema = z.object({
    email: z.string().email('Invalid email address')
});

const verifyEmailOTPSchema = z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric')
});

const sendMobileOTPSchema = z.object({
    phone: z.string().min(10, 'Invalid phone number').max(15, 'Invalid phone number')
});

const verifyMobileOTPSchema = z.object({
    phone: z.string().min(10, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric')
});

const registerWithPhoneSchema = z.object({
    phone: z.string().min(10, 'Invalid phone number'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    degree: z.string().optional(),
    universityId: z.string().optional(),
    collegeName: z.string().optional(),
    currentSemester: z.number().int().min(1).max(12).optional()
});

// ========================================
// EMAIL OTP ENDPOINTS
// ========================================

export const otpController = {
    /**
     * POST /api/auth/send-email-otp
     * Send OTP to email
     */
    sendEmailOTP: async (req: Request, res: Response) => {
        try {
            const validation = sendEmailOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { email } = validation.data;
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];

            const result = await emailOTPService.generateAndSendOTP(email, undefined, ipAddress, userAgent);

            if (!result.success) {
                return res.status(429).json({
                    success: false,
                    error: result.error
                });
            }

            return res.json({
                success: true,
                message: result.message,
                expiresIn: '10 minutes',
                attemptsRemaining: result.attemptsRemaining
            });
        } catch (error: any) {
            console.error('Send email OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send verification code'
            });
        }
    },

    /**
     * POST /api/auth/verify-email-otp
     * Verify email OTP
     */
    verifyEmailOTP: async (req: Request, res: Response) => {
        try {
            const validation = verifyEmailOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { email, otp } = validation.data;

            const result = await emailOTPService.verifyEmailOTP(email, otp);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    attemptsRemaining: result.attemptsRemaining
                });
            }

            return res.json({
                success: true,
                message: result.message,
                userId: result.userId
            });
        } catch (error: any) {
            console.error('Verify email OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify code'
            });
        }
    },

    /**
     * POST /api/auth/resend-email-otp
     * Resend email OTP
     */
    resendEmailOTP: async (req: Request, res: Response) => {
        try {
            const validation = sendEmailOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { email } = validation.data;
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];

            const result = await emailOTPService.resendEmailOTP(email, undefined, ipAddress, userAgent);

            if (!result.success) {
                return res.status(429).json({
                    success: false,
                    error: result.error
                });
            }

            return res.json({
                success: true,
                message: result.message,
                expiresIn: '10 minutes'
            });
        } catch (error: any) {
            console.error('Resend email OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to resend verification code'
            });
        }
    },

    // ========================================
    // MOBILE OTP ENDPOINTS
    // ========================================

    /**
     * POST /api/auth/send-mobile-otp
     * Send OTP to mobile via SMS
     */
    sendMobileOTP: async (req: Request, res: Response) => {
        try {
            const validation = sendMobileOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { phone } = validation.data;
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];

            const result = await mobileOTPService.generateMobileOTP(phone, undefined, ipAddress, userAgent);

            if (!result.success) {
                return res.status(429).json({
                    success: false,
                    error: result.error
                });
            }

            return res.json({
                success: true,
                message: result.message,
                expiresIn: '10 minutes',
                attemptsRemaining: result.attemptsRemaining
            });
        } catch (error: any) {
            console.error('Send mobile OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to send verification code'
            });
        }
    },

    /**
     * POST /api/auth/verify-mobile-otp
     * Verify mobile OTP
     */
    verifyMobileOTP: async (req: Request, res: Response) => {
        try {
            const validation = verifyMobileOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { phone, otp } = validation.data;

            const result = await mobileOTPService.verifyMobileOTP(phone, otp);

            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    attemptsRemaining: result.attemptsRemaining
                });
            }

            return res.json({
                success: true,
                message: result.message,
                userId: result.userId,
                formattedPhone: result.formattedPhone
            });
        } catch (error: any) {
            console.error('Verify mobile OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to verify code'
            });
        }
    },

    /**
     * POST /api/auth/resend-mobile-otp
     * Resend mobile OTP
     */
    resendMobileOTP: async (req: Request, res: Response) => {
        try {
            const validation = sendMobileOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { phone } = validation.data;
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];

            const result = await mobileOTPService.resendMobileOTP(phone, undefined, ipAddress, userAgent);

            if (!result.success) {
                return res.status(429).json({
                    success: false,
                    error: result.error
                });
            }

            return res.json({
                success: true,
                message: result.message,
                expiresIn: '10 minutes'
            });
        } catch (error: any) {
            console.error('Resend mobile OTP error:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to resend verification code'
            });
        }
    },

    // ========================================
    // PHONE-BASED AUTHENTICATION
    // ========================================

    /**
     * POST /api/auth/register-with-phone
     * Register new user with phone + OTP
     */
    registerWithPhone: async (req: Request, res: Response) => {
        try {
            const validation = registerWithPhoneSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { phone, otp, name, degree, universityId, collegeName, currentSemester } = validation.data;

            // Verify OTP first
            const otpResult = await mobileOTPService.verifyMobileOTP(phone, otp);
            if (!otpResult.success) {
                return res.status(400).json({
                    success: false,
                    error: otpResult.error
                });
            }

            // Check if user already exists
            const { prisma } = await import('../config/database');
            const existingUser = await (prisma as any).users.findUnique({
                where: { phone: otpResult.formattedPhone }
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'Phone number already registered'
                });
            }

            // Create new user
            const crypto = await import('crypto');
            const newUser = await (prisma as any).users.create({
                data: {
                    id: crypto.randomUUID(),
                    phone: otpResult.formattedPhone,
                    full_name: name.trim(),
                    degree: degree || null,
                    university_id: universityId || null,
                    college_name: collegeName || null,
                    current_semester: currentSemester || null,
                    auth_provider: 'phone',
                    phone_verified: true,
                    phone_verified_at: new Date(),
                    is_active: true,
                    preferred_language: 'en',
                    referral_code: `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                    password_hash: null, // Phone users don't have password
                    updated_at: new Date()
                }
            });

            // Create session and generate tokens
            const jwt = await import('jsonwebtoken');
            const sessionId = crypto.randomUUID();

            await (prisma as any).device_sessions.create({
                data: {
                    id: sessionId,
                    user_id: newUser.id,
                    session_id: sessionId,
                    user_agent: req.headers['user-agent'] || 'Unknown',
                    ip: req.ip || 'Unknown',
                    created_at: new Date(),
                    last_seen: new Date(),
                    is_revoked: false
                }
            });

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) throw new Error('JWT_SECRET not configured');

            const accessToken = jwt.sign(
                { userId: newUser.id, sessionId, type: 'access' },
                jwtSecret,
                { expiresIn: '2h' }
            );

            const refreshToken = jwt.sign(
                { userId: newUser.id, sessionId, type: 'refresh' },
                jwtSecret,
                { expiresIn: '7d' }
            );

            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    user: {
                        id: newUser.id,
                        phone: newUser.phone,
                        name: newUser.full_name,
                        phoneVerified: true
                    },
                    accessToken,
                    refreshToken,
                    expiresIn: '2h'
                }
            });
        } catch (error: any) {
            console.error('Register with phone error:', error);
            return res.status(500).json({
                success: false,
                error: 'Registration failed'
            });
        }
    },

    /**
     * POST /api/auth/login-with-phone
     * Login with phone + OTP
     */
    loginWithPhone: async (req: Request, res: Response) => {
        try {
            const validation = verifyMobileOTPSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.issues[0].message
                });
            }

            const { phone, otp } = validation.data;

            // Verify OTP
            const otpResult = await mobileOTPService.verifyMobileOTP(phone, otp);
            if (!otpResult.success) {
                return res.status(400).json({
                    success: false,
                    error: otpResult.error
                });
            }

            // Find user
            const { prisma } = await import('../config/database');
            const user = await (prisma as any).users.findUnique({
                where: { phone: otpResult.formattedPhone }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found. Please register first.'
                });
            }

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    error: 'Account is suspended. Please contact support.'
                });
            }

            // Create session and generate tokens
            const crypto = await import('crypto');
            const jwt = await import('jsonwebtoken');
            const sessionId = crypto.randomUUID();

            await (prisma as any).device_sessions.create({
                data: {
                    id: sessionId,
                    user_id: user.id,
                    session_id: sessionId,
                    user_agent: req.headers['user-agent'] || 'Unknown',
                    ip: req.ip || 'Unknown',
                    created_at: new Date(),
                    last_seen: new Date(),
                    is_revoked: false
                }
            });

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) throw new Error('JWT_SECRET not configured');

            const accessToken = jwt.sign(
                { userId: user.id, sessionId, type: 'access' },
                jwtSecret,
                { expiresIn: '2h' }
            );

            const refreshToken = jwt.sign(
                { userId: user.id, sessionId, type: 'refresh' },
                jwtSecret,
                { expiresIn: '7d' }
            );

            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        phone: user.phone,
                        name: user.full_name,
                        phoneVerified: user.phone_verified
                    },
                    accessToken,
                    refreshToken,
                    expiresIn: '2h'
                }
            });
        } catch (error: any) {
            console.error('Login with phone error:', error);
            return res.status(500).json({
                success: false,
                error: 'Login failed'
            });
        }
    }
};

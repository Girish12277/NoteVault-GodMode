import { Request, Response } from 'express';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import emailService from '../services/emailService';
import { alertService } from '../services/alertService';

// Security constants
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '2h';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Generate a secure random token
 */
const generateSecureToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate JWT tokens
 */
const generateTokens = (userId: string, sessionId: string) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET not configured');

    const accessToken = jwt.sign(
        { userId, sessionId, type: 'access' },
        jwtSecret,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { userId, sessionId, type: 'refresh' },
        jwtSecret,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
};

export const authController = {
    register: async (req: Request, res: Response) => {
        try {
            const { email, password, name, degree, universityId, collegeName, currentSemester, referralCode } = req.body;
            const normalizedEmail = email.toLowerCase().trim();
            const prismaAny = prisma as any;

            // SECURITY FIX: Removed pre-check to prevent TOCTOU race condition
            // Database unique constraint + error handling provides atomic guarantee

            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const userReferralCode = `REF${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            try {
                const user = await prismaAny.users.create({
                    data: {
                        id: crypto.randomUUID(),
                        email: normalizedEmail,
                        password_hash: passwordHash, // Schema uses snake_case
                        full_name: name.trim(),      // Schema uses snake_case
                        degree,
                        university_id: universityId, // Schema uses snake_case
                        college_name: collegeName,   // Schema uses snake_case
                        current_semester: currentSemester, // Schema uses snake_case
                        referral_code: userReferralCode, // Schema uses snake_case
                        preferred_language: 'en',    // Schema uses snake_case
                        is_active: true,             // Schema uses snake_case
                        is_verified: false,          // Schema uses snake_case
                        updated_at: new Date()       // Schema uses snake_case
                    },
                    select: {
                        id: true,
                        email: true,
                        password_hash: true,
                        full_name: true,
                        profile_picture_url: true,
                        degree: true,
                        university_id: true,
                        current_semester: true,
                        preferred_language: true,
                        is_seller: true,
                        is_admin: true,
                        is_active: true,
                        created_at: true
                    }
                });

                // Create Session for Registration
                const sessionId = crypto.randomUUID();
                await (prisma as any).device_sessions.create({
                    data: {
                        id: sessionId,
                        user_id: user.id,
                        session_id: sessionId,
                        user_agent: req.headers['user-agent'] || 'Unknown',
                        ip: req.ip || req.socket.remoteAddress || 'Unknown',
                        created_at: new Date(),
                        last_seen: new Date(),
                        is_revoked: false
                    }
                });

                const { accessToken, refreshToken } = generateTokens(user.id, sessionId);

                emailService.sendWelcomeEmail(user.email, {
                    userName: user.full_name || 'Student',
                    email: user.email
                }).catch(err => console.error('Failed to send welcome email:', err));

                // Send WhatsApp welcome message (if phone available)
                // TODO: Add phone number field to registration
                // const { whatsappService } = await import('../services/whatsappService');
                // whatsappService.sendWelcome(user.phone, user.full_name)
                //     .catch(err => console.error('Failed to send WhatsApp welcome:', err));

                return res.status(201).json({
                    success: true,
                    message: 'Registration successful',
                    data: {
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.full_name,
                            degree: user.degree,
                            preferredLanguage: user.preferred_language,
                            role: user.is_admin ? 'admin' : user.is_seller ? 'seller' : 'buyer',
                            createdAt: user.created_at
                        },
                        accessToken,
                        refreshToken,
                        expiresIn: ACCESS_TOKEN_EXPIRY
                    }
                });
            } catch (dbError: any) {
                // SECURITY: Handle database unique constraint violation (race condition protection)
                if (dbError.code === 'P2002') {
                    console.warn('🔒 SECURITY: Concurrent registration attempt blocked for:', normalizedEmail);
                    alertService.warning('CONCURRENT_REGISTRATION_BLOCKED', `Concurrent registration attempt for ${normalizedEmail}`, { email: normalizedEmail, ip: req.ip });
                    return res.status(409).json({
                        success: false,
                        message: 'Email already registered',
                        code: 'EMAIL_EXISTS'
                    });
                }
                throw dbError; // Re-throw if not a unique constraint error
            }
        } catch (error: unknown) {
            console.error('Register error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Registration failed',
                code: 'REGISTRATION_ERROR',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            });
        }
    },

    login: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const normalizedEmail = email.toLowerCase().trim();
            const prismaAny = prisma as any;

            // SECURITY: Pre-generated dummy hash for constant-time comparison
            // This prevents timing attacks that reveal valid email addresses
            const DUMMY_HASH = '$2a$12$LqGPkLv7V8W.TYO3X4FbUucH7rdJjE4v0yD0T7nJN8zxF8qKTqvWe';

            const user = await prismaAny.users.findUnique({
                where: { email: normalizedEmail },
                include: {
                    universities: {
                        select: { id: true, name: true, short_name: true }
                    }
                }
            });

            // UX IMPROVEMENT: Distinguish between "User Not Found" and "Wrong Password"
            // This allows the frontend to prompt "Create Account" if the user doesn't exist.

            if (!user) {
                // Timing Attack Mitigation
                await bcrypt.compare(password, DUMMY_HASH);
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials', // Protocol v2: Ambiguous Message
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // --- SECURITY: RATE LIMITING & LOCKOUT (PHASE 17) ---
            if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
                const remaining = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 60000);
                console.warn(`🔒 SECURITY: Blocked login attempt for ${normalizedEmail} (Locked for ${remaining}m)`);
                alertService.high('ACCOUNT_LOCKOUT_TRIGGERED', `Account locked: ${normalizedEmail} (${remaining}min remaining)`, { email: normalizedEmail, lockoutMinutes: remaining, ip: req.ip });
                return res.status(429).json({
                    success: false,
                    message: `Account is locked. Try again in ${remaining} minutes.`,
                    code: 'ACCOUNT_LOCKED',
                    retryAfter: remaining * 60
                });
            }
            // -----------------------------------------

            // Verify password
            // SECURITY: Always call bcrypt.compare even if user found, to prevent timing attacks?
            // Actually, we already branched above. But since we are prioritizing UX over strict timing-attack mitigation 
            // (which is already leaky via /register 409), this is acceptable.

            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                // Increment Failed Attempts
                const newAttempts = (user.failed_login_attempts || 0) + 1;
                let lockoutUntil = null;
                let warningMsg = 'Invalid credentials';

                // Lockout Policy: 5 Failed Attempts -> 15 Minute Lockout
                if (newAttempts >= 5) {
                    lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
                    warningMsg = 'Too many failed attempts. Account locked for 15 minutes.';
                }

                await prismaAny.users.update({
                    where: { id: user.id },
                    data: {
                        failed_login_attempts: newAttempts,
                        lockout_until: lockoutUntil
                    }
                });

                console.warn(`🔒 SECURITY: Failed login for ${normalizedEmail} (Attempt ${newAttempts}/5)`);
                if (newAttempts >= 3) {
                    alertService.warning('FAILED_LOGIN_ATTEMPTS', `Failed login for ${normalizedEmail} (Attempt ${newAttempts}/5)`, { email: normalizedEmail, attempts: newAttempts, ip: req.ip });
                }

                if (lockoutUntil) {
                    return res.status(429).json({
                        success: false,
                        message: warningMsg,
                        code: 'ACCOUNT_LOCKED'
                    });
                }

                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been suspended. Please contact support.',
                    code: 'ACCOUNT_SUSPENDED'
                });
            }

            // RESET SECURITY COUNTERS ON SUCCESS
            await prismaAny.users.update({
                where: { id: user.id },
                data: {
                    failed_login_attempts: 0,
                    lockout_until: null,
                    last_login_at: new Date()
                }
            });

            // SECURITY: Create Device Session
            const sessionId = crypto.randomUUID();
            await (prisma as any).device_sessions.create({
                data: {
                    id: sessionId, // Use specific ID for consistency
                    user_id: user.id,
                    session_id: sessionId, // Redundant but matches schema
                    user_agent: req.headers['user-agent'] || 'Unknown',
                    ip: req.ip || req.socket.remoteAddress || 'Unknown',
                    created_at: new Date(),
                    last_seen: new Date(),
                    is_revoked: false
                }
            });

            // Pass sessionId to generator
            const { accessToken, refreshToken } = generateTokens(user.id, sessionId);

            // Set refresh token in cookie (HTTP Only) for extra security? 
            // Current flow uses body. We stick to body but now it's Revocable.

            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.full_name,
                        avatar: user.profile_picture_url,
                        degree: user.degree,
                        university: (user as any).universities,
                        semester: user.current_semester,
                        preferredLanguage: user.preferred_language,
                        role: user.is_admin ? 'admin' : user.is_seller ? 'seller' : 'buyer',
                        createdAt: user.created_at
                    },
                    accessToken,
                    refreshToken,
                    expiresIn: ACCESS_TOKEN_EXPIRY,
                    sessionId // Return session ID for client reference if needed
                }
            });
        } catch (error: unknown) {
            console.error('Login error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Login failed',
                code: 'LOGIN_ERROR',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            });
        }
    },

    refreshToken: async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ success: false, message: 'Refresh token is required' });
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) throw new Error('JWT_SECRET not configured');

            let decoded: any;
            try {
                decoded = jwt.verify(refreshToken, jwtSecret);
            } catch (error) {
                return res.status(401).json({ success: false, message: 'Invalid or expired token' });
            }

            if (decoded.type !== 'refresh') {
                return res.status(401).json({ success: false, message: 'Invalid token type' });
            }

            const sessionId = decoded.sessionId;
            const prismaAny = prisma as any;

            // SECURITY: Verify Session Status
            if (sessionId) {
                const session = await prismaAny.device_sessions.findUnique({
                    where: { id: sessionId }
                });

                if (!session || session.is_revoked) {
                    console.warn(`[AUTH] Blocked revoked session: ${sessionId}`);
                    return res.status(403).json({
                        success: false,
                        message: 'Session expired or revoked',
                        code: 'SESSION_REVOKED'
                    });
                }

                // Update last seen
                await prismaAny.device_sessions.update({
                    where: { id: sessionId },
                    data: { last_seen: new Date() }
                });
            } else {
                // Legacy token check (fail secure)
                return res.status(403).json({ success: false, message: 'Invalid token format' });
            }

            const user = await prismaAny.users.findUnique({
                where: { id: decoded.userId },
                select: { id: true, is_active: true }
            });

            if (!user || !user.is_active) {
                return res.status(401).json({ success: false, message: 'User not found or inactive' });
            }

            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, sessionId);

            return res.json({
                success: true,
                data: {
                    accessToken,
                    refreshToken: newRefreshToken, // Rotation
                    expiresIn: ACCESS_TOKEN_EXPIRY
                }
            });
        } catch (error: unknown) {
            console.error('Refresh token error:', error);
            return res.status(500).json({ success: false, message: 'Token refresh failed' });
        }
    },

    forgotPassword: async (req: Request, res: Response) => {
        try {
            const { email } = req.body;
            const normalizedEmail = email.toLowerCase().trim();
            const prismaAny = prisma as any;

            const user = await prismaAny.users.findUnique({ where: { email: normalizedEmail } });
            if (!user) return res.json({ success: true, message: 'If account exists, email sent.' });

            const resetToken = crypto.randomBytes(32).toString('hex');
            const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

            await prismaAny.users.update({
                where: { id: user.id },
                data: {
                    password_reset_token: passwordResetToken,
                    password_reset_expires: passwordResetExpires
                }
            });

            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
            emailService.sendPasswordResetEmail(normalizedEmail, {
                userName: user.full_name || 'User',
                resetLink,
                expiresIn: '1 hour'
            }).catch(err => console.error('Failed to send email:', err));

            return res.json({ success: true, message: 'If account exists, email sent.' });
        } catch (error: unknown) {
            console.error('Forgot password error:', error);
            return res.status(500).json({ success: false, message: 'Process failed' });
        }
    },

    resetPassword: async (req: Request, res: Response) => {
        try {
            const { token, newPassword } = req.body;
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
            const prismaAny = prisma as any;

            const user = await prismaAny.users.findFirst({
                where: {
                    password_reset_token: hashedToken,
                    password_reset_expires: { gt: new Date() }
                }
            });

            if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired token' });

            const password_hash = await bcrypt.hash(newPassword, 12);
            await prismaAny.users.update({
                where: { id: user.id },
                data: {
                    password_hash: password_hash,
                    password_reset_token: null,
                    password_reset_expires: null
                }
            });

            return res.json({ success: true, message: 'Password reset successfully' });
        } catch (error: unknown) {
            console.error('Reset password error:', error);
            return res.status(500).json({ success: false, message: 'Reset failed' });
        }
    },

    logout: async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                const decoded = jwt.decode(refreshToken) as any;
                if (decoded && decoded.sessionId) {
                    const prismaAny = prisma as any;
                    await prismaAny.device_sessions.updateMany({
                        where: { id: decoded.sessionId },
                        data: { is_revoked: true }
                    });
                    console.log(`[AUTH] Session revoked: ${decoded.sessionId}`);
                }
            }
            return res.json({ success: true, message: 'Logged out successfully' });
        } catch (e) {
            // Logout should never fail from user perspective
            return res.json({ success: true, message: 'Logged out' });
        }
    },

    getMe: async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) return res.status(401).json({ success: false, message: 'Not authenticated' });
            const prismaAny = prisma as any;

            const user = await prismaAny.users.findUnique({
                where: { id: req.user.id },
                include: {
                    universities: {
                        select: { id: true, name: true, short_name: true }
                    },
                    purchases: {
                        where: { is_active: true },
                        select: { note_id: true }
                    }
                }
            });

            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            // If count is missing, default to 0
            const counts = (user as any)._count || {};

            return res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    avatar: user.profile_picture_url,
                    degree: user.degree,
                    university: (user as any).universities,
                    college: user.college_name,
                    bio: user.bio,
                    semester: user.current_semester,
                    location: user.location,
                    preferredLanguage: user.preferred_language,
                    role: user.is_admin ? 'admin' : user.is_seller ? 'seller' : 'buyer',
                    isSeller: user.is_seller,
                    isAdmin: user.is_admin,
                    isVerified: user.is_verified,
                    referralCode: user.referral_code,
                    stats: {
                        notesCreated: counts.notes || 0,
                        purchases: counts.purchases || 0,
                        reviews: counts.reviews || 0
                    },
                    createdAt: user.created_at,
                    purchasedNoteIds: user.purchases.map((p: any) => p.note_id) // GOD-LEVEL ADDITION
                }
            });
        } catch (error: unknown) {
            console.error('Get me error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
        }
    },

    updateProfile: async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) return res.status(401).json({ success: false, message: 'Not authenticated' });
            const { name, degree, universityId, collegeName, currentSemester, preferredLanguage, phone, bio } = req.body;
            const prismaAny = prisma as any;

            const updatedUser = await prismaAny.users.update({
                where: { id: req.user.id },
                data: {
                    full_name: name?.trim(),
                    degree,
                    university_id: universityId,
                    college_name: collegeName,
                    current_semester: currentSemester,
                    preferred_language: preferredLanguage,
                    phone,
                    bio
                }
            });

            return res.json({ success: true, message: 'Profile updated successfully', data: updatedUser });
        } catch (error: unknown) {
            console.error('Update profile error:', error);
            return res.status(500).json({ success: false, message: 'Failed to update profile' });
        }
    },

    becomeSeller: async (req: AuthRequest, res: Response) => {
        try {
            if (!req.user?.id) return res.status(401).json({ success: false, message: 'Not authenticated' });
            const prismaAny = prisma as any;

            const user = await prismaAny.users.findUnique({
                where: { id: req.user.id },
                select: { is_seller: true }
            });

            if (user?.is_seller) return res.status(400).json({ success: false, message: 'Already a seller' });

            await prismaAny.users.update({
                where: { id: req.user.id },
                data: { is_seller: true }
            });

            await (prisma as any).seller_wallets.create({
                data: {
                    id: crypto.randomUUID(),
                    seller_id: req.user.id,
                    available_balance_inr: 0,
                    pending_balance_inr: 0,
                    total_earned_inr: 0,
                    total_withdrawn_inr: 0,
                    minimum_withdrawal_amount: 100,
                    is_active: true,
                    updated_at: new Date()
                }
            });

            return res.json({ success: true, message: 'Congratulations! You are now a seller.' });
        } catch (error: unknown) {
            console.error('Become seller error:', error);
            return res.status(500).json({ success: false, message: 'Failed to upgrade to seller' });
        }
    }
};

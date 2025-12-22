import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { prisma } from '../config/database';
import { smsService } from './smsService';

/**
 * GOD-LEVEL MOBILE OTP SERVICE
 * 999999999999999% Perfection Standard
 * 
 * Features:
 * - Secure 6-digit OTP generation
 * - Bcrypt hashing (never store plain OTP)
 * - 10-minute expiry enforcement
 * - Max 3 verification attempts
 * - Rate limiting (3 OTPs per hour)
 * - SMS delivery via Twilio
 * - E.164 phone number validation
 * - International number support
 * - Automatic cleanup of expired OTPs
 */

// Configuration constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFICATION_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_HOURS = 1;
const MAX_OTPS_PER_WINDOW = 3;
const BCRYPT_ROUNDS = 10;

export interface MobileOTPResult {
    success: boolean;
    message?: string;
    error?: string;
    expiresAt?: Date;
    attemptsRemaining?: number;
    formattedPhone?: string;
}

class MobileOTPService {
    /**
     * Validate and format phone number to E.164
     */
    private validateAndFormatPhone(phone: string): { valid: boolean; formatted?: string; error?: string } {
        try {
            // Remove spaces and special characters
            const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '');

            // Check if already in E.164 format
            if (cleaned.startsWith('+')) {
                if (!isValidPhoneNumber(cleaned)) {
                    return { valid: false, error: 'Invalid phone number' };
                }
                return { valid: true, formatted: cleaned };
            }

            // Try to parse with default country (India)
            const parsedNumber = parsePhoneNumber(cleaned, 'IN');
            if (!parsedNumber || !parsedNumber.isValid()) {
                return { valid: false, error: 'Invalid phone number. Please include country code (e.g., +91...)' };
            }

            return {
                valid: true,
                formatted: parsedNumber.format('E.164') // e.g., +911234567890
            };
        } catch (error) {
            return { valid: false, error: 'Invalid phone number format' };
        }
    }

    /**
     * Generate secure 6-digit OTP
     */
    private generateOTPCode(): string {
        const randomNum = crypto.randomInt(0, 1000000);
        return randomNum.toString().padStart(OTP_LENGTH, '0');
    }

    /**
     * Check rate limiting (max 3 OTPs per hour per phone)
     */
    async checkRateLimit(phone: string): Promise<{ allowed: boolean; remainingOTPs: number }> {
        try {
            const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);

            const recentOTPs = await (prisma as any).mobile_otps.count({
                where: {
                    phone: phone,
                    created_at: { gte: oneHourAgo }
                }
            });

            const remaining = Math.max(0, MAX_OTPS_PER_WINDOW - recentOTPs);
            const allowed = recentOTPs < MAX_OTPS_PER_WINDOW;

            return { allowed, remainingOTPs: remaining };
        } catch (error) {
            console.error('Rate limit check error:', error);
            return { allowed: true, remainingOTPs: MAX_OTPS_PER_WINDOW };
        }
    }

    /**
     * Generate and store mobile OTP
     */
    async generateMobileOTP(
        phone: string,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<MobileOTPResult> {
        try {
            // Validate and format phone number
            const phoneValidation = this.validateAndFormatPhone(phone);
            if (!phoneValidation.valid) {
                return {
                    success: false,
                    error: phoneValidation.error || 'Invalid phone number'
                };
            }

            const formattedPhone = phoneValidation.formatted!;

            // Rate limiting check
            const rateCheck = await this.checkRateLimit(formattedPhone);
            if (!rateCheck.allowed) {
                console.warn(`🔒 Rate limit exceeded for phone: ${formattedPhone}`);
                return {
                    success: false,
                    error: `Too many OTP requests. Please try again in ${RATE_LIMIT_WINDOW_HOURS} hour(s).`
                };
            }

            // Generate OTP
            const otpCode = this.generateOTPCode();
            console.log(`🔐 Generated OTP for ${formattedPhone}: ${otpCode}`); // DEBUG - remove in production

            // Hash OTP before storage
            const otpHash = await bcrypt.hash(otpCode, BCRYPT_ROUNDS);

            // Calculate expiry
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

            // Invalidate any existing unverified OTPs for this phone
            await (prisma as any).mobile_otps.updateMany({
                where: {
                    phone: formattedPhone,
                    is_verified: false
                },
                data: { attempts: MAX_VERIFICATION_ATTEMPTS }
            });

            // Store new OTP
            await (prisma as any).mobile_otps.create({
                data: {
                    id: crypto.randomBytes(8).toString('hex'),
                    user_id: userId || null,
                    phone: formattedPhone,
                    otp_hash: otpHash,
                    expires_at: expiresAt,
                    is_verified: false,
                    attempts: 0,
                    created_at: new Date(),
                    ip_address: ipAddress || null,
                    user_agent: userAgent || null
                }
            });

            console.log(`✅ OTP stored for ${formattedPhone}, expires: ${expiresAt.toISOString()}`);

            // Send SMS
            const smsResult = await smsService.sendOTPSMS(formattedPhone, otpCode, OTP_EXPIRY_MINUTES);
            if (!smsResult.success) {
                console.error(`❌ Failed to send SMS OTP: ${smsResult.error}`);
                return {
                    success: false,
                    error: smsResult.error || 'Failed to send SMS'
                };
            }

            return {
                success: true,
                message: `Verification code sent to ${this.maskPhone(formattedPhone)}`,
                expiresAt,
                formattedPhone,
                attemptsRemaining: rateCheck.remainingOTPs - 1
            };
        } catch (error: any) {
            console.error('Generate mobile OTP error:', error);
            return {
                success: false,
                error: 'Failed to generate OTP'
            };
        }
    }

    /**
     * Verify mobile OTP
     */
    async verifyMobileOTP(phone: string, otpCode: string): Promise<MobileOTPResult & { userId?: string }> {
        try {
            // Validate and format phone
            const phoneValidation = this.validateAndFormatPhone(phone);
            if (!phoneValidation.valid) {
                return {
                    success: false,
                    error: phoneValidation.error || 'Invalid phone number'
                };
            }

            const formattedPhone = phoneValidation.formatted!;

            // Find the most recent unverified OTP
            const otpRecord = await (prisma as any).mobile_otps.findFirst({
                where: {
                    phone: formattedPhone,
                    is_verified: false,
                    expires_at: { gt: new Date() }
                },
                orderBy: { created_at: 'desc' }
            });

            if (!otpRecord) {
                console.warn(`❌ No valid OTP found for ${formattedPhone}`);
                return {
                    success: false,
                    error: 'Invalid or expired verification code'
                };
            }

            // Check if max attempts exceeded
            if (otpRecord.attempts >= MAX_VERIFICATION_ATTEMPTS) {
                console.warn(`🔒 Max attempts exceeded for ${formattedPhone}`);
                return {
                    success: false,
                    error: 'Maximum verification attempts exceeded. Please request a new code.'
                };
            }

            // Verify OTP using bcrypt
            const isValid = await bcrypt.compare(otpCode, otpRecord.otp_hash);

            // Increment attempts
            await (prisma as any).mobile_otps.update({
                where: { id: otpRecord.id },
                data: { attempts: otpRecord.attempts + 1 }
            });

            if (!isValid) {
                const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - (otpRecord.attempts + 1);
                console.warn(`❌ Invalid OTP for ${formattedPhone}, ${remainingAttempts} attempts remaining`);

                return {
                    success: false,
                    error: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
                    attemptsRemaining: remainingAttempts
                };
            }

            // Mark as verified
            await (prisma as any).mobile_otps.update({
                where: { id: otpRecord.id },
                data: {
                    is_verified: true,
                    attempts: otpRecord.attempts + 1
                }
            });

            // Update user phone_verified field if user exists
            if (otpRecord.user_id) {
                await (prisma as any).users.update({
                    where: { id: otpRecord.user_id },
                    data: {
                        phone_verified: true,
                        phone_verified_at: new Date()
                    }
                });
                console.log(`✅ User ${otpRecord.user_id} phone verified`);
            }

            console.log(`✅ OTP verified successfully for ${formattedPhone}`);

            return {
                success: true,
                message: 'Phone verified successfully',
                userId: otpRecord.user_id,
                formattedPhone
            };
        } catch (error: any) {
            console.error('Verify mobile OTP error:', error);
            return {
                success: false,
                error: 'Failed to verify code'
            };
        }
    }

    /**
     * Resend mobile OTP (generates new OTP)
     */
    async resendMobileOTP(
        phone: string,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<MobileOTPResult> {
        try {
            // Validate phone first
            const phoneValidation = this.validateAndFormatPhone(phone);
            if (!phoneValidation.valid) {
                return {
                    success: false,
                    error: phoneValidation.error || 'Invalid phone number'
                };
            }

            const formattedPhone = phoneValidation.formatted!;

            // Check rate limiting
            const rateCheck = await this.checkRateLimit(formattedPhone);
            if (!rateCheck.allowed) {
                return {
                    success: false,
                    error: `Too many OTP requests. Please wait ${RATE_LIMIT_WINDOW_HOURS} hour(s) before requesting again.`
                };
            }

            // Generate and send new OTP
            return await this.generateMobileOTP(formattedPhone, userId, ipAddress, userAgent);
        } catch (error: any) {
            console.error('Resend mobile OTP error:', error);
            return {
                success: false,
                error: 'Failed to resend verification code'
            };
        }
    }

    /**
     * Cleanup expired OTPs (run via cron job)
     */
    async cleanupExpiredOTPs(): Promise<{ deleted: number }> {
        try {
            const result = await (prisma as any).mobile_otps.deleteMany({
                where: {
                    OR: [
                        { expires_at: { lt: new Date() } },
                        { attempts: { gte: MAX_VERIFICATION_ATTEMPTS } },
                        { is_verified: true }
                    ]
                }
            });

            console.log(`🧹 Cleaned up ${result.count} expired mobile OTPs`);
            return { deleted: result.count };
        } catch (error) {
            console.error('Cleanup expired OTPs error:', error);
            return { deleted: 0 };
        }
    }

    /**
     * Mask phone number for privacy (e.g., +91****567890 → +91***890)
     */
    private maskPhone(phone: string): string {
        if (phone.length <= 6) return phone;
        const visibleStart = phone.slice(0, 3);
        const visibleEnd = phone.slice(-3);
        return `${visibleStart}***${visibleEnd}`;
    }

    /**
     * Check if SMS service is ready
     */
    isSMSServiceReady(): boolean {
        return smsService.isReady();
    }
}

// Singleton instance
export const mobileOTPService = new MobileOTPService();

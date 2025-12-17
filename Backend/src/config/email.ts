import nodemailer from 'nodemailer';
import { config } from './env';

/**
 * Email Service Configuration
 * Supports multiple email providers: SMTP, Gmail, SendGrid, etc.
 */

// Email transporter instance
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter based on environment config
 */
export const initializeEmailTransporter = (): nodemailer.Transporter | null => {
    const emailHost = process.env.EMAIL_HOST;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // Check if email is configured
    if (!emailHost || !emailUser || !emailPass) {
        console.warn('⚠️  Email not configured - email features disabled');
        return null;
    }

    try {
        // Create transporter based on email provider
        if (emailHost === 'gmail') {
            // Gmail configuration
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: emailUser,
                    pass: emailPass // Use App Password for Gmail
                }
            });
        } else {
            // Generic SMTP configuration
            transporter = nodemailer.createTransport({
                host: emailHost,
                port: parseInt(process.env.EMAIL_PORT || '587'),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: emailUser,
                    pass: emailPass
                }
            });
        }

        console.log('✅ Email service configured');
        return transporter;
    } catch (error) {
        console.error('❌ Email service failed to initialize:', error);
        return null;
    }
};

/**
 * Test email connection
 */
export const testEmailConnection = async (): Promise<boolean> => {
    if (!transporter) {
        return false;
    }

    try {
        await transporter.verify();
        console.log('✅ Email connection verified');
        return true;
    } catch (error) {
        console.error('❌ Email connection failed:', error);
        return false;
    }
};

/**
 * Get or create email transporter
 */
export const getTransporter = (): nodemailer.Transporter | null => {
    if (!transporter) {
        return initializeEmailTransporter();
    }
    return transporter;
};

// Email configuration constants
export const EMAIL_CONFIG = {
    from: {
        name: process.env.EMAIL_FROM_NAME || 'StudyVault',
        address: process.env.EMAIL_FROM_ADDRESS || 'noreply@studyvault.com'
    },
    templates: {
        welcome: 'welcome',
        passwordReset: 'password-reset',
        purchaseConfirmation: 'purchase-confirmation',
        saleNotification: 'sale-notification',
        noteApproved: 'note-approved',
        noteRejected: 'note-rejected',
        payoutProcessed: 'payout-processed'
    }
};

export default {
    initializeEmailTransporter,
    testEmailConnection,
    getTransporter,
    EMAIL_CONFIG
};

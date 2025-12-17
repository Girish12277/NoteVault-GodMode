import { getTransporter, EMAIL_CONFIG } from '../config/email';
import {
    emailTemplates,
    WelcomeEmailData,
    PasswordResetEmailData,
    PurchaseConfirmationData,
    SaleNotificationData,
    NoteApprovedData,
    NoteRejectedData,
    PayoutProcessedData
} from './emailTemplates';

/**
 * Email Service
 * Handles sending transactional emails
 */

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send an email
 */
export const sendEmail = async (options: SendEmailOptions): Promise<EmailResult> => {
    const transporter = getTransporter();

    if (!transporter) {
        console.warn('⚠️  Email not sent - transporter not configured');
        return {
            success: false,
            error: 'Email service not configured'
        };
    }

    try {
        const result = await transporter.sendMail({
            from: `"${EMAIL_CONFIG.from.name}" <${EMAIL_CONFIG.from.address}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        });

        console.log(`✉️  Email sent to ${options.to}: ${result.messageId}`);

        return {
            success: true,
            messageId: result.messageId
        };
    } catch (error) {
        console.error('❌ Email send failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (to: string, data: WelcomeEmailData): Promise<EmailResult> => {
    const template = emailTemplates.welcome(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to: string, data: PasswordResetEmailData): Promise<EmailResult> => {
    const template = emailTemplates.passwordReset(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

/**
 * Send purchase confirmation email to buyer
 */
export const sendPurchaseConfirmationEmail = async (to: string, data: PurchaseConfirmationData): Promise<EmailResult> => {
    const template = emailTemplates.purchaseConfirmation(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

/**
 * Send sale notification email to seller
 */
export const sendSaleNotificationEmail = async (to: string, data: SaleNotificationData): Promise<EmailResult> => {
    const template = emailTemplates.saleNotification(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

/**
 * Send note approved email to seller
 */
export const sendNoteApprovedEmail = async (to: string, data: NoteApprovedData): Promise<EmailResult> => {
    const template = emailTemplates.noteApproved(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

/**
 * Send note rejected email to seller
 */
export const sendNoteRejectedEmail = async (to: string, data: NoteRejectedData): Promise<EmailResult> => {
    const template = emailTemplates.noteRejected(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

/**
 * Send payout processed email to seller
 */
export const sendPayoutProcessedEmail = async (to: string, data: PayoutProcessedData): Promise<EmailResult> => {
    const template = emailTemplates.payoutProcessed(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
};

export const emailService = {
    sendEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendPurchaseConfirmationEmail,
    sendSaleNotificationEmail,
    sendNoteApprovedEmail,
    sendNoteRejectedEmail,
    sendPayoutProcessedEmail
};

export default emailService;

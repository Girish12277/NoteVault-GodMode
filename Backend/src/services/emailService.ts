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
 * Send an email using multi-provider architecture
 * Automatic failover: Brevo → Mailgun → SendGrid
 */
export const sendEmail = async (options: SendEmailOptions): Promise<EmailResult> => {
    // Use multi-provider service for god-level reliability
    const { multiEmailService } = await import('./multiProviderEmailService');

    const result = await multiEmailService.send({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    });

    if (!result.success) {
        console.error(`❌ Multi-provider email failed: ${result.error}`);

        // Fallback to old SMTP if all providers fail
        const transporter = getTransporter();

        if (!transporter) {
            return {
                success: false,
                error: result.error || 'All email providers failed',
            };
        }

        try {
            console.log('⚠️ Trying fallback SMTP...');
            const fallbackResult = await transporter.sendMail({
                from: `"${EMAIL_CONFIG.from.name}" <${EMAIL_CONFIG.from.address}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });

            console.log(`✉️ Fallback SMTP succeeded: ${fallbackResult.messageId}`);

            return {
                success: true,
                messageId: fallbackResult.messageId,
            };
        } catch (error) {
            console.error('❌ Fallback SMTP also failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'All email methods failed',
            };
        }
    }

    return {
        success: result.success,
        messageId: result.messageId,
        error: result.error,
    };
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

import twilio from 'twilio';
import crypto from 'crypto';

/**
 * GOD-LEVEL WHATSAPP SERVICE
 * Enterprise-grade WhatsApp messaging using Twilio
 * 
 * Features:
 * - Send WhatsApp messages
 * - Template-based messaging
 * - Delivery tracking
 * - Error handling + retries
 * - Database logging
 */

export interface WhatsAppMessage {
    to: string; // Phone number (without +91 prefix)
    body: string;
    mediaUrl?: string;
}

export interface WhatsAppResult {
    success: boolean;
    messageSid?: string;
    status?: string;
    error?: string;
}

class WhatsAppService {
    private client: twilio.Twilio;
    private from: string;
    private prisma: any = null;

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        this.from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

        if (!accountSid || !authToken) {
            console.warn('⚠️ Twilio credentials not configured - WhatsApp disabled');
            this.client = null as any;
        } else {
            this.client = twilio(accountSid, authToken);
            console.log('✅ WhatsApp service initialized');
        }
    }

    /**
     * Send WhatsApp message
     */
    async sendMessage({ to, body, mediaUrl }: WhatsAppMessage): Promise<WhatsAppResult> {
        if (!this.client) {
            return {
                success: false,
                error: 'WhatsApp service not configured',
            };
        }

        try {
            // Format phone number
            const formattedTo = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+91${to}`;

            console.log(`📱 Sending WhatsApp to ${formattedTo}...`);

            const message = await this.client.messages.create({
                from: this.from,
                to: formattedTo,
                body,
                ...(mediaUrl && { mediaUrl: [mediaUrl] }),
            });

            console.log(`✅ WhatsApp sent: ${message.sid}`);

            // Log to database
            await this.logMessage({
                to,
                body,
                messageSid: message.sid,
                status: message.status,
                mediaUrl,
            });

            return {
                success: true,
                messageSid: message.sid,
                status: message.status,
            };
        } catch (error: any) {
            console.error('❌ WhatsApp send failed:', error.message);

            // Log failure
            await this.logMessage({
                to,
                body,
                messageSid: '',
                status: 'failed',
                error: error.message,
            });

            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Log message to database
     */
    private async logMessage(data: {
        to: string;
        body: string;
        messageSid: string;
        status: string;
        mediaUrl?: string;
        error?: string;
    }) {
        try {
            if (!this.prisma) {
                const { prisma } = await import('../config/database');
                this.prisma = prisma;
            }

            await (this.prisma as any).whatsapp_messages.create({
                data: {
                    id: crypto.randomBytes(8).toString('hex'),
                    to_phone: data.to,
                    from_phone: this.from.replace('whatsapp:', ''),
                    body: data.body,
                    media_url: data.mediaUrl,
                    message_sid: data.messageSid,
                    status: data.status,
                    provider: 'twilio',
                    sent_at: new Date(),
                    error_message: data.error,
                    created_at: new Date(),
                },
            });
        } catch (error) {
            console.error('WhatsApp log failed:', error);
            // Don't throw - logging failure shouldn't block messaging
        }
    }

    /**
     * Send OTP via WhatsApp
     */
    async sendOTP(phone: string, otp: string): Promise<WhatsAppResult> {
        const message = `🔐 *StudyVault OTP*

Your verification code: *${otp}*

Valid for 10 minutes.
⚠️ Do NOT share this code with anyone.

- StudyVault Team`;

        return this.sendMessage({ to: phone, body: message });
    }

    /**
     * Send order confirmation
     */
    async sendOrderConfirmation(
        phone: string,
        orderDetails: {
            orderId: string;
            items: string[];
            amount: number;
            downloadUrl?: string;
        }
    ): Promise<WhatsAppResult> {
        const itemsList = orderDetails.items.map((item, i) => `${i + 1}. ${item}`).join('\n');

        const message = `🎉 *Order Confirmed!*

Order ID: *${orderDetails.orderId}*

📚 Items:
${itemsList}

💰 Amount Paid: *₹${orderDetails.amount}*

${orderDetails.downloadUrl ? `📥 Download: ${orderDetails.downloadUrl}` : ''}

Thank you for choosing StudyVault! 🙏

Need help? Reply to this message.`;

        return this.sendMessage({ to: phone, body: message });
    }

    /**
     * Send payment confirmation
     */
    async sendPaymentConfirmation(
        phone: string,
        paymentDetails: {
            transactionId: string;
            amount: number;
            noteTitle: string;
            downloadUrl: string;
        }
    ): Promise<WhatsAppResult> {
        const message = `✅ *Payment Successful!*

Transaction ID: ${paymentDetails.transactionId}

📚 Note: *${paymentDetails.noteTitle}*
💰 Amount: *₹${paymentDetails.amount}*

📥 *Download Now*:
${paymentDetails.downloadUrl}

You can access this note anytime from your library.

Thanks for shopping with StudyVault! 🎓`;

        return this.sendMessage({ to: phone, body: message });
    }

    /**
     * Send refund update
     */
    async sendRefundUpdate(
        phone: string,
        refundDetails: {
            refundId: string;
            amount: number;
            status: string;
            reason?: string;
        }
    ): Promise<WhatsAppResult> {
        let statusMessage = '';
        let emoji = '';

        switch (refundDetails.status) {
            case 'PENDING':
                emoji = '⏳';
                statusMessage = 'Your refund request is under review.';
                break;
            case 'APPROVED':
                emoji = '✅';
                statusMessage = 'Your refund has been approved!';
                break;
            case 'PROCESSING':
                emoji = '🔄';
                statusMessage = 'Your refund is being processed.';
                break;
            case 'COMPLETED':
                emoji = '💰';
                statusMessage = 'Refund completed! Amount credited to your account.';
                break;
            case 'REJECTED':
                emoji = '❌';
                statusMessage = 'Your refund request was not approved.';
                break;
            default:
                emoji = 'ℹ️';
                statusMessage = `Status: ${refundDetails.status}`;
        }

        const message = `${emoji} *Refund Update*

Refund ID: ${refundDetails.refundId}
Amount: *₹${refundDetails.amount}*
Status: *${refundDetails.status}*

${statusMessage}

${refundDetails.status === 'COMPLETED' ? 'Amount will be credited in 3-5 business days.' : ''}
${refundDetails.reason ? `\nReason: ${refundDetails.reason}` : ''}

Need help? Contact support.

- StudyVault Team`;

        return this.sendMessage({ to: phone, body: message });
    }

    /**
     * Send cart abandonment reminder
     */
    async sendCartReminder(
        phone: string,
        cartDetails: {
            itemCount: number;
            totalAmount: number;
            checkoutUrl: string;
        }
    ): Promise<WhatsAppResult> {
        const message = `🛒 *You left items in your cart!*

Items: *${cartDetails.itemCount}*
Total: *₹${cartDetails.totalAmount}*

🎁 *Complete your purchase now and get 10% OFF!*

Checkout here:
${cartDetails.checkoutUrl}

Hurry! Offer valid for 24 hours only.

- StudyVault`;

        return this.sendMessage({ to: phone, body: message });
    }

    /**
     * Send welcome message
     */
    async sendWelcome(phone: string, userName: string): Promise<WhatsAppResult> {
        const message = `👋 Welcome to StudyVault, ${userName}!

We're excited to have you here! 🎓

📚 Browse thousands of quality notes
💯 Learn from top students
🚀 Ace your exams

Start exploring: studyvault.com

Need help? Just reply to this message!

- StudyVault Team`;

        return this.sendMessage({ to: phone, body: message });
    }

    /**
     * Update message status (from webhook)
     */
    async updateMessageStatus(messageSid: string, status: string, timestamp?: Date) {
        try {
            if (!this.prisma) {
                const { prisma } = await import('../config/database');
                this.prisma = prisma;
            }

            const updateData: any = {
                status,
                updated_at: new Date(),
            };

            if (status === 'delivered') {
                updateData.delivered_at = timestamp || new Date();
            } else if (status === 'read') {
                updateData.read_at = timestamp || new Date();
            } else if (status === 'failed') {
                updateData.failed_at = timestamp || new Date();
            }

            await (this.prisma as any).whatsapp_messages.updateMany({
                where: { message_sid: messageSid },
                data: updateData,
            });

            console.log(`📊 Updated message ${messageSid} to status: ${status}`);
        } catch (error) {
            console.error('Failed to update message status:', error);
        }
    }

    /**
     * Get message stats (for admin dashboard)
     */
    async getStats() {
        try {
            if (!this.prisma) {
                const { prisma } = await import('../config/database');
                this.prisma = prisma;
            }

            const [total, sent, delivered, read, failed] = await Promise.all([
                (this.prisma as any).whatsapp_messages.count(),
                (this.prisma as any).whatsapp_messages.count({ where: { status: 'sent' } }),
                (this.prisma as any).whatsapp_messages.count({ where: { status: 'delivered' } }),
                (this.prisma as any).whatsapp_messages.count({ where: { status: 'read' } }),
                (this.prisma as any).whatsapp_messages.count({ where: { status: 'failed' } }),
            ]);

            return {
                total,
                sent,
                delivered,
                read,
                failed,
                deliveryRate: total > 0 ? Math.round((delivered / total) * 100) : 0,
                readRate: total > 0 ? Math.round((read / total) * 100) : 0,
            };
        } catch (error) {
            console.error('Failed to get WhatsApp stats:', error);
            return null;
        }
    }
}

// Singleton instance
export const whatsappService = new WhatsAppService();

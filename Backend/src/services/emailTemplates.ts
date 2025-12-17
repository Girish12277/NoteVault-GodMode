/**
 * Email Templates
 * HTML templates for transactional emails
 */

const baseStyles = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #ffffff;
`;

const headerStyles = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
`;

const buttonStyles = `
    display: inline-block;
    padding: 14px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    margin: 20px 0;
`;

const footerStyles = `
    text-align: center;
    padding: 20px;
    color: #666;
    font-size: 12px;
    border-top: 1px solid #eee;
    margin-top: 30px;
`;

/**
 * Base email template wrapper
 */
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="${baseStyles}">
        <div style="${headerStyles}">
            <h1 style="margin: 0; font-size: 28px;">📚 StudyVault</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${title}</p>
        </div>
        <div style="padding: 30px;">
            ${content}
        </div>
        <div style="${footerStyles}">
            <p>© ${new Date().getFullYear()} StudyVault. All rights reserved.</p>
            <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
`;

export interface WelcomeEmailData {
    userName: string;
    email: string;
}

export interface PasswordResetEmailData {
    userName: string;
    resetLink: string;
    expiresIn: string;
}

export interface PurchaseConfirmationData {
    userName: string;
    noteTitle: string;
    noteId: string;
    amount: number;
    transactionId: string;
    downloadLink: string;
}

export interface SaleNotificationData {
    sellerName: string;
    noteTitle: string;
    buyerName: string;
    amount: number;
    earnings: number;
}

export interface NoteApprovedData {
    sellerName: string;
    noteTitle: string;
    noteId: string;
}

export interface NoteRejectedData {
    sellerName: string;
    noteTitle: string;
    reason: string;
}

export interface PayoutProcessedData {
    sellerName: string;
    amount: number;
    transactionReference: string;
    bankDetails?: string;
}

/**
 * Welcome email template
 */
export const welcomeEmail = (data: WelcomeEmailData) => ({
    subject: 'Welcome to StudyVault! 🎉',
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Welcome, ${data.userName}! 👋</h2>
        <p style="color: #555; line-height: 1.6;">
            Thank you for joining StudyVault - India's premier notes marketplace for students.
        </p>
        <p style="color: #555; line-height: 1.6;">
            You can now:
        </p>
        <ul style="color: #555; line-height: 1.8;">
            <li>📖 Browse thousands of quality notes from top students</li>
            <li>🔍 Search notes by subject, semester, university</li>
            <li>💰 Become a seller and earn by sharing your notes</li>
            <li>⭐ Rate and review notes you purchase</li>
        </ul>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/explore" style="${buttonStyles}">
            Start Exploring Notes →
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
            Your account email: <strong>${data.email}</strong>
        </p>
    `, 'Welcome to StudyVault'),
    text: `Welcome to StudyVault, ${data.userName}! Start exploring notes at ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
});

/**
 * Password reset email template
 */
export const passwordResetEmail = (data: PasswordResetEmailData) => ({
    subject: 'Reset Your Password - StudyVault',
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.6;">
            Hi ${data.userName},
        </p>
        <p style="color: #555; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password:
        </p>
        <a href="${data.resetLink}" style="${buttonStyles}">
            Reset Password
        </a>
        <p style="color: #888; font-size: 14px;">
            This link expires in ${data.expiresIn}.
        </p>
        <p style="color: #888; font-size: 14px;">
            If you didn't request this password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
            Can't click the button? Copy this link: ${data.resetLink}
        </p>
    `, 'Password Reset'),
    text: `Reset your password: ${data.resetLink} (expires in ${data.expiresIn})`
});

/**
 * Purchase confirmation email template
 */
export const purchaseConfirmationEmail = (data: PurchaseConfirmationData) => ({
    subject: `Purchase Confirmed: ${data.noteTitle}`,
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Purchase Confirmed! ✅</h2>
        <p style="color: #555; line-height: 1.6;">
            Hi ${data.userName},
        </p>
        <p style="color: #555; line-height: 1.6;">
            Thank you for your purchase! Your notes are now ready for download.
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Order Details</h3>
            <table style="width: 100%; color: #555;">
                <tr><td><strong>Note:</strong></td><td>${data.noteTitle}</td></tr>
                <tr><td><strong>Amount:</strong></td><td>₹${data.amount}</td></tr>
                <tr><td><strong>Transaction ID:</strong></td><td>${data.transactionId}</td></tr>
            </table>
        </div>
        <a href="${data.downloadLink}" style="${buttonStyles}">
            📥 Download Notes
        </a>
        <p style="color: #888; font-size: 14px; margin-top: 30px;">
            You can also access your purchased notes from your dashboard.
        </p>
    `, 'Purchase Confirmation'),
    text: `Purchase confirmed! Download your notes: ${data.downloadLink}`
});

/**
 * Sale notification email for sellers
 */
export const saleNotificationEmail = (data: SaleNotificationData) => ({
    subject: `You made a sale! 🎉 - ${data.noteTitle}`,
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Congratulations! You made a sale! 🎉</h2>
        <p style="color: #555; line-height: 1.6;">
            Hi ${data.sellerName},
        </p>
        <p style="color: #555; line-height: 1.6;">
            Great news! Someone just purchased your notes.
        </p>
        <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2e7d32;">Sale Details</h3>
            <table style="width: 100%; color: #333;">
                <tr><td><strong>Note:</strong></td><td>${data.noteTitle}</td></tr>
                <tr><td><strong>Buyer:</strong></td><td>${data.buyerName}</td></tr>
                <tr><td><strong>Sale Amount:</strong></td><td>₹${data.amount}</td></tr>
                <tr><td><strong>Your Earnings:</strong></td><td style="color: #2e7d32; font-weight: bold;">₹${data.earnings}</td></tr>
            </table>
        </div>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/dashboard" style="${buttonStyles}">
            View Dashboard →
        </a>
    `, 'Sale Notification'),
    text: `You sold "${data.noteTitle}" to ${data.buyerName}! You earned ₹${data.earnings}`
});

/**
 * Note approved email
 */
export const noteApprovedEmail = (data: NoteApprovedData) => ({
    subject: `Your note is approved! ✅ - ${data.noteTitle}`,
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Your Note is Live! ✅</h2>
        <p style="color: #555; line-height: 1.6;">
            Hi ${data.sellerName},
        </p>
        <p style="color: #555; line-height: 1.6;">
            Great news! Your note "<strong>${data.noteTitle}</strong>" has been approved and is now live on the marketplace.
        </p>
        <p style="color: #555; line-height: 1.6;">
            Students can now discover and purchase your notes. Keep creating great content!
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/notes/${data.noteId}" style="${buttonStyles}">
            View Your Note →
        </a>
    `, 'Note Approved'),
    text: `Your note "${data.noteTitle}" is now live on StudyVault!`
});

/**
 * Note rejected email
 */
export const noteRejectedEmail = (data: NoteRejectedData) => ({
    subject: `Action Required: Note "${data.noteTitle}"`,
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Note Review Feedback</h2>
        <p style="color: #555; line-height: 1.6;">
            Hi ${data.sellerName},
        </p>
        <p style="color: #555; line-height: 1.6;">
            Unfortunately, your note "<strong>${data.noteTitle}</strong>" could not be approved at this time.
        </p>
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #e65100;">Reason:</h4>
            <p style="color: #555; margin-bottom: 0;">${data.reason}</p>
        </div>
        <p style="color: #555; line-height: 1.6;">
            Please update your note and resubmit for approval. If you have questions, contact our support team.
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/notes" style="${buttonStyles}">
            Edit Your Note →
        </a>
    `, 'Note Review'),
    text: `Your note "${data.noteTitle}" was not approved. Reason: ${data.reason}`
});

/**
 * Payout processed email
 */
export const payoutProcessedEmail = (data: PayoutProcessedData) => ({
    subject: `Payout Processed: ₹${data.amount}`,
    html: baseTemplate(`
        <h2 style="color: #333; margin-top: 0;">Payout Processed! 💰</h2>
        <p style="color: #555; line-height: 1.6;">
            Hi ${data.sellerName},
        </p>
        <p style="color: #555; line-height: 1.6;">
            Your payout has been processed successfully.
        </p>
        <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1565c0;">Payout Details</h3>
            <table style="width: 100%; color: #333;">
                <tr><td><strong>Amount:</strong></td><td style="font-size: 24px; color: #1565c0;">₹${data.amount}</td></tr>
                <tr><td><strong>Reference ID:</strong></td><td>${data.transactionReference}</td></tr>
                ${data.bankDetails ? `<tr><td><strong>Sent to:</strong></td><td>${data.bankDetails}</td></tr>` : ''}
            </table>
        </div>
        <p style="color: #888; font-size: 14px;">
            The amount should reflect in your bank account within 2-3 business days.
        </p>
    `, 'Payout Processed'),
    text: `Payout of ₹${data.amount} processed! Reference ID: ${data.transactionReference}`
});

export const emailTemplates = {
    welcome: welcomeEmail,
    passwordReset: passwordResetEmail,
    purchaseConfirmation: purchaseConfirmationEmail,
    saleNotification: saleNotificationEmail,
    noteApproved: noteApprovedEmail,
    noteRejected: noteRejectedEmail,
    payoutProcessed: payoutProcessedEmail
};

export default emailTemplates;

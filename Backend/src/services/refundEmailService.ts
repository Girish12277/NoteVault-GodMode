import { RefundService } from './refundService';
import { queueService } from './queueService';

/**
 * God-Level Refund Email Templates
 * Automated notification system for complete refund lifecycle
 */

interface RefundEmailData {
    userName: string;
    userEmail: string;
    refundId: string;
    transactionId: string;
    noteTitle: string;
    amount: string;
    reason: string;
    reasonDetails?: string;
    estimatedTime?: string;
    adminNotes?: string;
}

export class RefundEmailService {
    /**
     * Email: Refund request initiated
     * Sent immediately after user submits refund request
     */
    static async sendRefundInitiatedEmail(data: RefundEmailData) {
        const subject = data.estimatedTime?.includes('auto-approved')
            ? `✅ Refund Approved - ${data.refundId}`
            : `🔄 Refund Requested - ${data.refundId}`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      ${data.estimatedTime?.includes('auto-approved') ? `
        <span class="status-badge status-approved">AUTO-APPROVED ✓</span>
        <p>Great news! Your refund has been <strong>automatically approved</strong> and is being processed right now.</p>
      ` : `
        <span class="status-badge status-pending">UNDER REVIEW</span>
        <p>We've received your refund request and it's currently under review by our team.</p>
      `}
      
      <div class="info-box">
        <h3>Refund Details</h3>
        <p><strong>Refund ID:</strong> ${data.refundId}</p>
        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        <p><strong>Product:</strong> ${data.noteTitle}</p>
        <p><strong>Amount:</strong> ₹${data.amount}</p>
        <p><strong>Reason:</strong> ${data.reason.replace(/_/g, ' ')}</p>
        ${data.reasonDetails ? `<p><strong>Details:</strong> ${data.reasonDetails}</p>` : ''}
        <p><strong>Estimated Processing:</strong> ${data.estimatedTime || '24-48 hours'}</p>
      </div>
      
      <p><strong>Money-Back Guarantee:</strong> We stand behind our 30-day money-back guarantee.</p>
      
      <p>Thanks for being part of our community,<br>
      <strong>The StudyVault Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} StudyVault. All rights reserved.</p>
      <p>Refund ID: ${data.refundId}</p>
    </div>
  </div>
</body>
</html>
    `;

        // Queue email using correct API
        await queueService.addEmailJob(
            data.userEmail,
            subject,
            htmlBody,
            undefined,
            'refund_initiated'
        );

        return { success: true };
    }

    /**
     * Email: Refund approved by admin
     */
    static async sendRefundApprovedEmail(data: RefundEmailData) {
        const subject = `✅ Refund Approved - ${data.refundId}`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; background: #d1fae5; color: #065f46; font-weight: 600; margin: 10px 0; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Refund Approved!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <span class="status-badge">APPROVED ✓</span>
      
      <p>Good news! Your refund request has been <strong>approved</strong> and is now being processed.</p>
      
      <div class="info-box">
        <h3>Refund Summary</h3>
        <p><strong>Refund ID:</strong> ${data.refundId}</p>
        <p><strong>Amount:</strong> ₹${data.amount}</p>
        <p><strong>Product:</strong> ${data.noteTitle}</p>
        ${data.adminNotes ? `<p><strong>Admin Note:</strong> ${data.adminNotes}</p>` : ''}
      </div>
      
      <p><strong>Important:</strong> You will lose access to the purchased notes once the refund is completed.</p>
      
      <p>Thank you for your understanding,<br>
      <strong>The StudyVault Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} StudyVault. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

        await queueService.addEmailJob(
            data.userEmail,
            subject,
            htmlBody,
            undefined,
            'refund_approved'
        );

        return { success: true };
    }

    /**
     * Email: Refund completed successfully
     */
    static async sendRefundCompletedEmail(data: RefundEmailData & { razorpayRefundId?: string }) {
        const subject = `✅ Refund Completed - ₹${data.amount}`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-icon { font-size: 60px; text-align: center; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981; }
    .highlight { background: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">✅</div>
      <h1>Refund Completed!</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>Your refund has been <strong>successfully processed</strong>! 🎉</p>
      
      <div class="info-box">
        <h3>Transaction Details</h3>
        <p><strong>Refund ID:</strong> ${data.refundId}</p>
        <p><strong>Amount Refunded:</strong> ₹${data.amount}</p>
        <p><strong>Product:</strong> ${data.noteTitle}</p>
        ${data.razorpayRefundId ? `<p><strong>Gateway Reference:</strong> ${data.razorpayRefundId}</p>` : ''}
      </div>
      
      <div class="highlight">
        <h3>💳 When Will I Receive the Money?</h3>
        <p>The refunded amount will appear in your original payment method within <strong>3-5 business days</strong>.</p>
      </div>
      
      <p>Best regards,<br>
      <strong>The StudyVault Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} StudyVault. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

        await queueService.addEmailJob(
            data.userEmail,
            subject,
            htmlBody,
            undefined,
            'refund_completed'
        );

        return { success: true };
    }

    /**
     * Email: Refund rejected by admin
     */
    static async sendRefundRejectedEmail(data: RefundEmailData) {
        const subject = `ℹ️ Refund Request Update - ${data.refundId}`;

        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #64748b 0%, #475569 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f7fafc; padding: 30px; border-radius: 0 0 10px 10px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .support-box { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .footer { text-align: center; color: #718096; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refund Request Update</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>We've reviewed your refund request for <strong>${data.noteTitle}</strong>.</p>
      
      <div class="info-box">
        <h3>Request Details</h3>
        <p><strong>Refund ID:</strong> ${data.refundId}</p>
        <p><strong>Amount:</strong> ₹${data.amount}</p>
        <p><strong>Your Reason:</strong> ${data.reason.replace(/_/g, ' ')}</p>
        ${data.adminNotes ? `<p><strong>Admin Response:</strong> ${data.adminNotes}</p>` : ''}
      </div>
      
      <p>Unfortunately, we're unable to process this refund request based on our refund policy.</p>
      
      <div class="support-box">
        <h3>💬 Have Questions?</h3>
        <p>If you believe this decision was made in error, please reply to this email. Our support team is here to help!</p>
      </div>
      
      <p>Thank you,<br>
      <strong>The StudyVault Team</strong></p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} StudyVault. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

        await queueService.addEmailJob(
            data.userEmail,
            subject,
            htmlBody,
            undefined,
            'refund_rejected'
        );

        return { success: true };
    }
}

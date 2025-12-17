import { Request, Response } from 'express';
import { prisma } from '../config/database';
const prismaAny = prisma as any;
import { sendEmail } from '../services/emailService';

export const contactController = {
    /**
     * POST /api/contact
     * Submit a public inquiry
     */
    submit: async (req: Request, res: Response) => {
        try {
            const { name, email, phone, subject, message } = req.body as any;

            // 1. Save to Database
            const inquiry = await prismaAny.contactInquiry.create({
                data: {
                    name,
                    email,
                    phone,
                    subject,
                    message,
                    status: 'NEW'
                }
            });

            // 2. Async Email Notification (Non-blocking)
            sendEmail({
                to: process.env.CONTACT_EMAIL || 'support@notesmarket.in',
                subject: `[New Inquiry] ${subject}`,
                html: `
                    <h3>New Website Inquiry</h3>
                    <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr />
                    <p>${message.replace(/\n/g, '<br/>')}</p>
                    <br />
                    <p><small>ID: ${inquiry.id}</small></p>
                `
            }).catch(console.error);

            return res.status(201).json({
                success: true,
                message: 'Your message has been sent successfully.',
                data: { id: inquiry.id }
            });
        } catch (error: any) {
            console.error('Contact submit error:', error);
            require('fs').writeFileSync('debug_error.log', JSON.stringify(error, Object.getOwnPropertyNames(error)) + '\n' + JSON.stringify(error), { flag: 'a' });
            return res.status(500).json({
                success: false,
                message: 'Failed to submit inquiry'
            });
        }
    },

    /**
     * GET /api/contact
     * Admin: List all inquiries
     */
    list: async (req: Request, res: Response) => {
        try {
            const { page = 1, limit = 20, status, search } = (req as any).query;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {};
            if (status) where.status = status;
            if (search) {
                where.OR = [
                    { name: { contains: String(search), mode: 'insensitive' } },
                    { email: { contains: String(search), mode: 'insensitive' } },
                    { subject: { contains: String(search), mode: 'insensitive' } }
                ];
            }

            const [inquiries, total] = await Promise.all([
                prismaAny.contactInquiry.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' }
                }),
                prismaAny.contactInquiry.count({ where })
            ]);

            return res.json({
                success: true,
                data: {
                    inquiries,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: any) {
            console.error('Contact list error:', error);
            return res.status(500).json({ success: false, message: 'Failed to fetch inquiries' });
        }
    },

    /**
     * PATCH /api/contact/:id/status
     * Admin: Update status (Read/Replied)
     */
    updateStatus: async (req: Request, res: Response) => {
        try {
            const { id } = (req as any).params;
            const { status } = req.body as any; // Validated by middleware

            const updated = await prismaAny.contactInquiry.update({
                where: { id },
                data: { status }
            });

            return res.json({
                success: true,
                message: 'Status updated',
                data: updated
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Failed to update status' });
        }
    },

    /**
     * DELETE /api/contact/:id
     * Admin: Delete inquiry
     */
    delete: async (req: Request, res: Response) => {
        try {
            const { id } = (req as any).params;
            await prismaAny.contactInquiry.delete({ where: { id } });
            return res.json({ success: true, message: 'Inquiry deleted' });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
        }
    }
};

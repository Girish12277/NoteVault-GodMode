import { Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const prismaAny = prisma as any;

export const reportController = {
    /**
     * POST /api/reports
     * Create a new report
     */
    create: async (req: AuthRequest, res: Response) => {
        try {
            const { reason, details, noteId, reviewId } = req.body;
            const userId = req.user!.id;

            if (!noteId && !reviewId) {
                return res.status(400).json({
                    success: false,
                    message: 'Report must be linked to a note or review'
                });
            }

            const report = await prismaAny.report.create({
                data: {
                    userId,
                    reason,
                    details,
                    noteId,
                    reviewId
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Report submitted successfully',
                data: report
            });
        } catch (error: unknown) {
            console.error('Create report error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to submit report',
                code: 'CREATE_ERROR'
            });
        }
    },

    /**
     * GET /api/reports (Admin)
     * List all reports
     */
    list: async (req: AuthRequest, res: Response) => {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = {};
            if (status) where.status = status;

            const [reports, total] = await Promise.all([
                prismaAny.report.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        users: { select: { full_name: true, email: true } },
                        notes: { select: { title: true } },
                        reviews: { select: { comment: true } }
                    }
                }),
                prismaAny.report.count({ where })
            ]);

            return res.json({
                success: true,
                data: {
                    reports: reports.map((r: any) => ({
                        ...r,
                        user: r.users,
                        note: r.notes,
                        review: r.reviews
                    })),
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: unknown) {
            console.error('List reports error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch reports'
            });
        }
    },

    /**
     * PUT /api/reports/:id (Admin)
     * Update report status
     */
    updateStatus: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const report = await prismaAny.report.update({
                where: { id },
                data: { status }
            });

            return res.json({
                success: true,
                message: 'Report updated',
                data: report
            });
        } catch (error: unknown) {
            console.error('Update report error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update report'
            });
        }
    }
};

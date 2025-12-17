import { Request, Response } from 'express';
import { prisma } from '../config/database';

const prismaAny = prisma as any;

export const universityController = {
    // GET /api/universities
    list: async (_req: Request, res: Response) => {
        try {
            // Use prismaAny to bypass strict typing
            const universities = await prismaAny.universities.findMany({
                where: { is_active: true },
                include: {
                    _count: {
                        select: { notes: true, users: true }
                    }
                },
                orderBy: { name: 'asc' }
            });

            const formattedUniversities = universities.map((uni: any) => ({
                id: uni.id,
                name: uni.name,
                shortName: uni.shortName || uni.short_name,
                state: uni.state,
                city: uni.city,
                type: uni.type,
                coursesOffered: uni.coursesOffered || uni.courses_offered,
                noteCount: uni._count?.notes || 0,
                studentCount: uni._count?.users || 0
            }));

            return res.json({
                success: true,
                data: formattedUniversities
            });
        } catch (error: any) {
            console.error('University list error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch universities',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // GET /api/universities/:id
    getById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const university = await prismaAny.universities.findUnique({
                where: { id },
                include: {
                    notes: {
                        where: {
                            is_active: true,
                            is_approved: true,
                            is_deleted: false
                        },
                        take: 20,
                        orderBy: { created_at: 'desc' },
                        include: {
                            seller: {
                                select: { id: true, full_name: true, profile_picture_url: true }
                            },
                            category: {
                                select: { name: true, name_hi: true, icon: true }
                            }
                        }
                    },
                    _count: {
                        select: { notes: true, users: true }
                    }
                }
            });

            if (!university) {
                return res.status(404).json({
                    success: false,
                    message: 'University not found'
                });
            }

            const uni = university as any;

            return res.json({
                success: true,
                data: {
                    id: uni.id,
                    name: uni.name,
                    shortName: uni.shortName || uni.short_name,
                    state: uni.state,
                    city: uni.city,
                    type: uni.type,
                    coursesOffered: uni.coursesOffered || uni.courses_offered,
                    noteCount: uni._count?.notes || 0,
                    studentCount: uni._count?.users || 0,
                    recentNotes: (uni.notes || []).map((n: any) => ({
                        ...n,
                        seller: {
                            id: n.seller?.id,
                            fullName: n.seller?.fullName || n.seller?.full_name,
                            profilePictureUrl: n.seller?.profilePictureUrl || n.seller?.profile_picture_url
                        },
                        category: {
                            name: n.category?.name,
                            nameHi: n.category?.nameHi || n.category?.name_hi,
                            icon: n.category?.icon
                        }
                    }))
                }
            });
        } catch (error: any) {
            console.error('University fetch error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch university',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

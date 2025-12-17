import { Request, Response } from 'express';
import { prisma } from '../config/database';

const prismaAny = prisma as any;

export const searchController = {
    // GET /api/search?query=...&filters
    search: async (req: Request, res: Response) => {
        try {
            const {
                query,
                degree,
                universityId,
                categoryId,
                semester,
                language,
                minPrice,
                maxPrice,
                sortBy = 'recent',
                page = '1',
                limit = '20'
            } = req.query;

            const skip = (Number(page) - 1) * Number(limit);

            // Build where clause
            const where: any = {
                is_active: true,
                is_approved: true,
                is_deleted: false
            };

            // Text search
            if (query) {
                where.OR = [
                    { title: { contains: query as string, mode: 'insensitive' } },
                    { description: { contains: query as string, mode: 'insensitive' } },
                    { subject: { contains: query as string, mode: 'insensitive' } }
                ];
            }

            if (minPrice) where.price_inr = { gte: parseFloat(minPrice as string) };
            if (maxPrice) where.price_inr = { ...where.price_inr, lte: parseFloat(maxPrice as string) };

            // Sorting
            const orderBy: any = {};
            switch (sortBy) {
                case 'price_low':
                    orderBy.price_inr = 'asc';
                    break;
                case 'price_high':
                    orderBy.price_inr = 'desc';
                    break;
                case 'rating':
                    orderBy.average_rating = 'desc';
                    break;
                case 'popular':
                    orderBy.purchase_count = 'desc';
                    break;
                case 'recent':
                default:
                    orderBy.created_at = 'desc';
            }

            const [notes, total] = await Promise.all([
                prismaAny.notes.findMany({
                    where,
                    orderBy,
                    skip,
                    take: Number(limit),
                    include: {
                        seller: { select: { id: true, full_name: true } },
                        category: { select: { name: true, name_hi: true, icon: true } },
                        university: { select: { name: true, short_name: true } }
                    }
                }),
                prismaAny.notes.count({ where })
            ]);

            const formattedNotes = notes.map((n: any) => ({
                id: n.id,
                title: n.title,
                description: n.description,
                subject: n.subject,
                price: Number(n.price_inr),
                rating: Number(n.average_rating || 0),
                sellerName: n.seller?.full_name,
                categoryName: n.category?.name,
                universityName: n.university?.name,
                createdAt: n.created_at
            }));

            res.json({
                success: true,
                data: {
                    notes: formattedNotes,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Search failed',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

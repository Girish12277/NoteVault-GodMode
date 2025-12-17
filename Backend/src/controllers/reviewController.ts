import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const prismaAny = prisma as any;

export const reviewController = {
    // GET /api/reviews/:noteId
    list: async (req: Request, res: Response) => {
        try {
            const { noteId } = req.params;

            const reviews = await prismaAny.reviews.findMany({
                where: {
                    note_id: noteId,
                    is_approved: true
                },
                include: {
                    users: {
                        select: { id: true, full_name: true, profile_picture_url: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const formattedReviews = reviews.map((review: any) => ({
                id: review.id,
                noteId: review.note_id,
                userId: review.user_id,
                userName: review.users?.full_name,
                userImage: review.users?.profile_picture_url,
                rating: review.rating,
                comment: review.comment,
                isVerifiedPurchase: review.is_verified_purchase,
                createdAt: review.created_at
            }));

            return res.json({
                success: true,
                data: formattedReviews
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch reviews',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // POST /api/reviews/:noteId
    create: async (req: AuthRequest, res: Response) => {
        try {
            const { noteId } = req.params;
            const userId = req.user!.id;
            const { rating, title, comment } = req.body;

            // Find purchase to get transactionId (REQUIRED field)
            const purchase = await prismaAny.purchases.findFirst({
                where: {
                    user_id: userId,
                    note_id: noteId,
                    is_active: true
                }
            });

            if (!purchase) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only review notes you have purchased'
                });
            }

            // Check if already reviewed
            const existingReview = await prismaAny.reviews.findFirst({
                where: { note_id: noteId, user_id: userId }
            });

            if (existingReview) {
                return res.status(400).json({
                    success: false,
                    message: 'You have already reviewed this note'
                });
            }

            // Create review WITH transactionId
            const review = await prismaAny.reviews.create({
                data: {
                    id: crypto.randomUUID(),
                    note_id: noteId,
                    user_id: userId,
                    transaction_id: purchase.transaction_id,
                    rating: parseInt(rating),
                    title,
                    comment,
                    is_verified_purchase: true,
                    is_approved: true,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            // Update note's average rating
            const allReviews = await prismaAny.reviews.findMany({
                where: { note_id: noteId, is_approved: true },
                select: { rating: true }
            });

            const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;

            await prismaAny.notes.update({
                where: { id: noteId },
                data: {
                    average_rating: avgRating,
                    total_reviews: allReviews.length,
                    updated_at: new Date()
                }
            });

            return res.status(201).json({
                success: true,
                data: review,
                message: 'Review submitted successfully'
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create review',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

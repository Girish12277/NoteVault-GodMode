import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

const prismaAny = prisma as any;

export const categoryController = {
    /**
     * GET /api/categories
     * Get all categories with note counts
     */
    list: async (_req: Request, res: Response) => {
        try {
            // Use prisma.categories (plural) to match schema
            const categories = await prismaAny.categories.findMany({
                include: {
                    _count: {
                        select: { notes: true }
                    }
                },
                orderBy: { name: 'asc' }
            });

            // Cast cat to any
            const formattedCategories = categories.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                nameHi: cat.name_hi,
                slug: cat.slug,
                icon: cat.icon || '📚',
                count: cat._count?.notes || 0
            }));

            return res.json({
                success: true,
                data: formattedCategories
            });
        } catch (error: unknown) {
            console.error('Category list error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch categories',
                code: 'FETCH_ERROR',
                error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
            });
        }
    },

    /**
     * GET /api/categories/:id
     * Get single category with its notes
     */
    getById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const category = await prismaAny.categories.findUnique({
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
                                select: { id: true, full_name: true }
                            },
                            universities: {
                                select: { name: true, short_name: true }
                            }
                        }
                    },
                    _count: {
                        select: { notes: true }
                    }
                }
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found',
                    code: 'NOT_FOUND'
                });
            }

            const catAny = category as any;
            return res.json({
                success: true,
                data: {
                    id: catAny.id,
                    name: catAny.name,
                    nameHi: catAny.name_hi,
                    slug: catAny.slug,
                    icon: catAny.icon,
                    noteCount: catAny._count?.notes || 0,
                    notes: (catAny.notes || []).map((n: any) => ({
                        ...n,
                        seller: n.seller ? { id: n.seller.id, fullName: n.seller.full_name } : null
                    }))
                }
            });
        } catch (error: unknown) {
            console.error('Category fetch error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch category',
                code: 'FETCH_ERROR'
            });
        }
    },

    /**
     * POST /api/categories (Admin only)
     * Create a new category
     */
    create: async (req: AuthRequest, res: Response) => {
        try {
            const { name, nameHi, slug, icon } = req.body;

            // Check for duplicate slug
            const existing = await prismaAny.categories.findUnique({
                where: { slug }
            });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: 'A category with this slug already exists',
                    code: 'DUPLICATE_SLUG'
                });
            }

            const category = await prismaAny.categories.create({
                data: {
                    id: crypto.randomUUID(),
                    name,
                    name_hi: nameHi,
                    slug: slug.toLowerCase(),
                    icon,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            return res.status(201).json({
                success: true,
                message: 'Category created successfully',
                data: category
            });
        } catch (error: unknown) {
            console.error('Category create error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create category',
                code: 'CREATE_ERROR'
            });
        }
    },

    /**
     * PUT /api/categories/:id (Admin only)
     * Update a category
     */
    update: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { name, nameHi, slug, icon } = req.body;

            // Check if category exists
            const existing = await prismaAny.categories.findUnique({
                where: { id }
            });

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found',
                    code: 'NOT_FOUND'
                });
            }

            // Check for duplicate slug if changing
            if (slug && slug !== existing.slug) {
                const duplicateSlug = await prismaAny.categories.findUnique({
                    where: { slug }
                });

                if (duplicateSlug) {
                    return res.status(409).json({
                        success: false,
                        message: 'A category with this slug already exists',
                        code: 'DUPLICATE_SLUG'
                    });
                }
            }

            const category = await prismaAny.categories.update({
                where: { id },
                data: {
                    name,
                    name_hi: nameHi,
                    slug: slug?.toLowerCase(),
                    icon,
                    updated_at: new Date()
                }
            });

            return res.json({
                success: true,
                message: 'Category updated successfully',
                data: category
            });
        } catch (error: unknown) {
            console.error('Category update error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update category',
                code: 'UPDATE_ERROR'
            });
        }
    },

    /**
     * DELETE /api/categories/:id (Admin only)
     * Delete a category (only if no notes)
     */
    delete: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            // Check if category exists and has notes
            const category = await prismaAny.categories.findUnique({
                where: { id },
                include: {
                    _count: { select: { notes: true } }
                }
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found',
                    code: 'NOT_FOUND'
                });
            }

            if ((category as any)._count?.notes > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete category with ${(category as any)._count.notes} notes. Move or delete notes first.`,
                    code: 'HAS_NOTES'
                });
            }

            await prismaAny.categories.delete({
                where: { id }
            });

            return res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error: unknown) {
            console.error('Category delete error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to delete category',
                code: 'DELETE_ERROR'
            });
        }
    }
};


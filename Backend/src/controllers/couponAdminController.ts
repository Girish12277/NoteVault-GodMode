import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { CouponType, CouponScope } from '@prisma/client';
import { logger } from '../services/logger';
import crypto from 'crypto';

export const couponAdminController = {
    /**
     * POST /api/admin/coupons
     * Create a new coupon
     */
    create: async (req: AuthRequest, res: Response) => {
        try {
            const {
                code,
                description,
                type,
                value,
                minOrderValue,
                maxDiscountAmount,
                startDate,
                endDate,
                usageLimitGlobal,
                usageLimitPerUser,
                scope,
                scopeIds,
                isActive
            } = req.body;

            // Validation: Required fields
            if (!type || !value) {
                return res.status(400).json({
                    success: false,
                    message: 'Type and value are required',
                    code: 'MISSING_FIELDS'
                });
            }

            // Generate code if not provided
            let couponCode = code;
            if (!couponCode) {
                couponCode = `SAVE${Math.floor(Math.random() * 100)}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
            }

            // Validate code format
            if (!/^[A-Z0-9-]{4,20}$/.test(couponCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Code must be 4-20 characters, uppercase alphanumeric with hyphens only',
                    code: 'INVALID_CODE_FORMAT'
                });
            }

            // Check code uniqueness
            const existingCoupon = await prisma.coupons.findUnique({
                where: { code: couponCode }
            });

            if (existingCoupon) {
                return res.status(400).json({
                    success: false,
                    message: 'Coupon code already exists',
                    code: 'DUPLICATE_CODE'
                });
            }

            // Validate discount value
            if (type === CouponType.PERCENTAGE) {
                if (value < 1 || value > 100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Percentage must be between 1 and 100',
                        code: 'INVALID_PERCENTAGE'
                    });
                }
            } else if (type === CouponType.FLAT) {
                if (value <= 0 || value > 10000) {
                    return res.status(400).json({
                        success: false,
                        message: 'Flat amount must be between 1 and 10000 INR',
                        code: 'INVALID_AMOUNT'
                    });
                }
            }

            // Validate date range
            const start = startDate ? new Date(startDate) : new Date();
            const end = endDate ? new Date(endDate) : null;

            if (end && end <= start) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date',
                    code: 'INVALID_DATE_RANGE'
                });
            }

            if (end && end < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'End date cannot be in the past',
                    code: 'PAST_END_DATE'
                });
            }

            // Validate scope and scope_ids
            const couponScope = scope || CouponScope.GLOBAL;
            const couponScopeIds = scopeIds || [];

            if (couponScope !== CouponScope.GLOBAL && couponScopeIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Scope IDs required for non-global scope',
                    code: 'MISSING_SCOPE_IDS'
                });
            }

            // Verify scope IDs exist
            if (couponScope === CouponScope.CATEGORY && couponScopeIds.length > 0) {
                const categories = await prisma.categories.findMany({
                    where: { id: { in: couponScopeIds } }
                });
                if (categories.length !== couponScopeIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more category IDs are invalid',
                        code: 'INVALID_CATEGORY_IDS'
                    });
                }
            } else if (couponScope === CouponScope.SELLER && couponScopeIds.length > 0) {
                const sellers = await prisma.users.findMany({
                    where: { id: { in: couponScopeIds }, is_seller: true }
                });
                if (sellers.length !== couponScopeIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more seller IDs are invalid',
                        code: 'INVALID_SELLER_IDS'
                    });
                }
            } else if (couponScope === CouponScope.NOTE && couponScopeIds.length > 0) {
                const notes = await prisma.notes.findMany({
                    where: { id: { in: couponScopeIds }, is_deleted: false }
                });
                if (notes.length !== couponScopeIds.length) {
                    return res.status(400).json({
                        success: false,
                        message: 'One or more note IDs are invalid',
                        code: 'INVALID_NOTE_IDS'
                    });
                }
            }

            // Create coupon
            const coupon = await prisma.coupons.create({
                data: {
                    code: couponCode,
                    description: description || null,
                    type,
                    value: Number(value),
                    min_order_value: minOrderValue ? Number(minOrderValue) : null,
                    max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
                    start_date: start,
                    end_date: end,
                    usage_limit_global: usageLimitGlobal ? Number(usageLimitGlobal) : null,
                    usage_limit_per_user: usageLimitPerUser ? Number(usageLimitPerUser) : null,
                    scope: couponScope,
                    scope_ids: couponScopeIds,
                    is_active: isActive !== undefined ? isActive : true
                }
            });

            logger.info(`Admin ${req.user!.id} created coupon ${coupon.code}`);

            return res.status(201).json({
                success: true,
                message: 'Coupon created successfully',
                data: coupon
            });
        } catch (error: any) {
            logger.error('Coupon creation error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to create coupon',
                code: 'CREATE_ERROR'
            });
        }
    },

    /**
     * GET /api/admin/coupons
     * List all coupons with pagination and filters
     */
    list: async (req: AuthRequest, res: Response) => {
        try {
            const {
                page = '1',
                limit = '20',
                status,
                type,
                scope,
                search
            } = req.query;

            const skip = (Number(page) - 1) * Number(limit);
            const where: any = {};

            // Filters
            if (status === 'active') where.is_active = true;
            if (status === 'inactive') where.is_active = false;
            if (type) where.type = type;
            if (scope) where.scope = scope;
            if (search) {
                where.code = {
                    contains: String(search).toUpperCase(),
                    mode: 'insensitive'
                };
            }

            const [coupons, total] = await Promise.all([
                prisma.coupons.findMany({
                    where,
                    orderBy: { created_at: 'desc' },
                    skip,
                    take: Number(limit),
                    include: {
                        _count: {
                            select: { usages: true }
                        }
                    }
                }),
                prisma.coupons.count({ where })
            ]);

            // Calculate total discount given for each coupon
            const couponsWithStats = await Promise.all(
                coupons.map(async (coupon) => {
                    const usageStats = await prisma.coupon_usages.aggregate({
                        where: { coupon_id: coupon.id },
                        _sum: { discount_amount: true }
                    });

                    return {
                        ...coupon,
                        totalDiscountGiven: Number(usageStats._sum.discount_amount || 0),
                        usageCount: coupon._count.usages
                    };
                })
            );

            return res.json({
                success: true,
                data: {
                    coupons: couponsWithStats,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: any) {
            logger.error('Coupon list error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch coupons',
                code: 'FETCH_ERROR'
            });
        }
    },

    /**
     * GET /api/admin/coupons/:id
     * Get single coupon details
     */
    getById: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const coupon = await prisma.coupons.findUnique({
                where: { id },
                include: {
                    _count: {
                        select: { usages: true }
                    }
                }
            });

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                    code: 'NOT_FOUND'
                });
            }

            // Get usage statistics
            const usageStats = await prisma.coupon_usages.aggregate({
                where: { coupon_id: id },
                _sum: { discount_amount: true },
                _avg: { discount_amount: true }
            });

            return res.json({
                success: true,
                data: {
                    ...coupon,
                    usageCount: coupon._count.usages,
                    totalDiscountGiven: Number(usageStats._sum.discount_amount || 0),
                    averageDiscountPerUse: Number(usageStats._avg.discount_amount || 0)
                }
            });
        } catch (error: any) {
            logger.error('Coupon fetch error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch coupon',
                code: 'FETCH_ERROR'
            });
        }
    },

    /**
     * PUT /api/admin/coupons/:id
     * Update existing coupon
     */
    update: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const {
                description,
                value,
                minOrderValue,
                maxDiscountAmount,
                endDate,
                usageLimitGlobal,
                usageLimitPerUser,
                isActive
            } = req.body;

            // Check if coupon exists
            const existingCoupon = await prisma.coupons.findUnique({
                where: { id },
                include: {
                    _count: { select: { usages: true } }
                }
            });

            if (!existingCoupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                    code: 'NOT_FOUND'
                });
            }

            // Prevent certain changes if coupon has been used
            const hasBeenUsed = existingCoupon._count.usages > 0;

            // Validate value if provided
            if (value !== undefined) {
                if (existingCoupon.type === CouponType.PERCENTAGE) {
                    if (value < 1 || value > 100) {
                        return res.status(400).json({
                            success: false,
                            message: 'Percentage must be between 1 and 100',
                            code: 'INVALID_PERCENTAGE'
                        });
                    }
                } else if (existingCoupon.type === CouponType.FLAT) {
                    if (value <= 0 || value > 10000) {
                        return res.status(400).json({
                            success: false,
                            message: 'Flat amount must be between 1 and 10000 INR',
                            code: 'INVALID_AMOUNT'
                        });
                    }
                }
            }

            // Validate end date
            if (endDate) {
                const end = new Date(endDate);
                if (end <= existingCoupon.start_date) {
                    return res.status(400).json({
                        success: false,
                        message: 'End date must be after start date',
                        code: 'INVALID_DATE_RANGE'
                    });
                }
            }

            // Update coupon
            const updateData: any = {};
            if (description !== undefined) updateData.description = description;
            if (value !== undefined) updateData.value = Number(value);
            if (minOrderValue !== undefined) updateData.min_order_value = minOrderValue ? Number(minOrderValue) : null;
            if (maxDiscountAmount !== undefined) updateData.max_discount_amount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
            if (endDate !== undefined) updateData.end_date = endDate ? new Date(endDate) : null;
            if (usageLimitGlobal !== undefined) updateData.usage_limit_global = usageLimitGlobal ? Number(usageLimitGlobal) : null;
            if (usageLimitPerUser !== undefined) updateData.usage_limit_per_user = usageLimitPerUser ? Number(usageLimitPerUser) : null;
            if (isActive !== undefined) updateData.is_active = isActive;

            const updatedCoupon = await prisma.coupons.update({
                where: { id },
                data: updateData
            });

            logger.info(`Admin ${req.user!.id} updated coupon ${updatedCoupon.code}`);

            return res.json({
                success: true,
                message: 'Coupon updated successfully',
                data: updatedCoupon
            });
        } catch (error: any) {
            logger.error('Coupon update error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to update coupon',
                code: 'UPDATE_ERROR'
            });
        }
    },

    /**
     * DELETE /api/admin/coupons/:id
     * Soft delete (deactivate) coupon
     */
    delete: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const coupon = await prisma.coupons.findUnique({
                where: { id }
            });

            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                    code: 'NOT_FOUND'
                });
            }

            // Soft delete by deactivating
            await prisma.coupons.update({
                where: { id },
                data: { is_active: false }
            });

            logger.info(`Admin ${req.user!.id} deactivated coupon ${coupon.code}`);

            return res.json({
                success: true,
                message: 'Coupon deactivated successfully'
            });
        } catch (error: any) {
            logger.error('Coupon delete error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to deactivate coupon',
                code: 'DELETE_ERROR'
            });
        }
    },

    /**
     * GET /api/admin/coupons/:id/usage
     * Get coupon usage history
     */
    getUsageHistory: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { page = '1', limit = '50' } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            const [usages, total] = await Promise.all([
                prisma.coupon_usages.findMany({
                    where: { coupon_id: id },
                    orderBy: { used_at: 'desc' },
                    skip,
                    take: Number(limit),
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true
                            }
                        }
                    }
                }),
                prisma.coupon_usages.count({ where: { coupon_id: id } })
            ]);

            return res.json({
                success: true,
                data: {
                    usages,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error: any) {
            logger.error('Coupon usage history error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch usage history',
                code: 'FETCH_ERROR'
            });
        }
    },

    /**
     * POST /api/admin/coupons/generate-code
     * Generate a unique coupon code
     */
    generateCode: async (req: AuthRequest, res: Response) => {
        try {
            const { prefix } = req.body;
            let code: string;
            let isUnique = false;
            let attempts = 0;

            while (!isUnique && attempts < 10) {
                const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
                code = prefix ? `${prefix}-${randomPart}` : `SAVE${Math.floor(Math.random() * 100)}-${randomPart}`;

                const existing = await prisma.coupons.findUnique({
                    where: { code }
                });

                if (!existing) {
                    isUnique = true;
                    return res.json({
                        success: true,
                        data: { code }
                    });
                }

                attempts++;
            }

            return res.status(500).json({
                success: false,
                message: 'Failed to generate unique code',
                code: 'GENERATION_ERROR'
            });
        } catch (error: any) {
            logger.error('Code generation error', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to generate code',
                code: 'GENERATION_ERROR'
            });
        }
    }
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        fullName: string;
        isSeller: boolean;
        isAdmin: boolean;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            algorithms: ['HS256'], // Strict algorithm enforcement
            complete: false
        }) as any;
        const prismaAny = prisma as any;

        // FIXED: Use 'users' model (plural/snake_case)
        const user = await prismaAny.users.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        // FIXED: Use snake_case fields
        if (user.is_active === false) {
            return res.status(401).json({ success: false, message: 'User not found or inactive' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            fullName: user.full_name, // Schema: full_name
            isSeller: user.is_seller, // Schema: is_seller
            isAdmin: user.is_admin    // Schema: is_admin
        };

        return next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

export const requireSeller = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user?.isSeller && !req.user?.isAdmin) {
        console.warn(`[AUTH] 403 Forbidden: User ${req.user?.id} (Seller: ${req.user?.isSeller}, Admin: ${req.user?.isAdmin}) attempted restricted action.`);
        return res.status(403).json({
            success: false,
            message: 'Seller access required'
        });
    }
    return next();
};

export const requireAdmin = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    return next();
};

export const optionalAuthenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const prismaAny = prisma as any;

        // FIXED: Use 'users' model
        const user = await prismaAny.users.findUnique({
            where: { id: decoded.userId }
        });

        if (user) {
            // FIXED: Use snake_case fields
            if (user.is_active !== false) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    isSeller: user.is_seller,
                    isAdmin: user.is_admin
                };
            }
        }
        next();
    } catch (error) {
        // Ignore invalid tokens
        next();
    }
};

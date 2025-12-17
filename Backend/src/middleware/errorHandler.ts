import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error details
    console.error('Error occurred:', {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        userId: (req as any).userId,
        timestamp: new Date().toISOString()
    });

    // Handle known AppError instances
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            code: err.code,
            ...(err instanceof ValidationError && { errors: err.errors })
        });
    }

    // Handle Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err as any;

        // Unique constraint violation
        if (prismaError.code === 'P2002') {
            return res.status(409).json({
                success: false,
                message: 'A record with this value already exists',
                code: 'DUPLICATE_ENTRY',
                field: prismaError.meta?.target
            });
        }

        // Record not found
        if (prismaError.code === 'P2025') {
            return res.status(404).json({
                success: false,
                message: 'Record not found',
                code: 'NOT_FOUND'
            });
        }

        // Foreign key constraint violation
        if (prismaError.code === 'P2003') {
            return res.status(400).json({
                success: false,
                message: 'Invalid reference to related record',
                code: 'INVALID_REFERENCE'
            });
        }
    }

    // Handle Prisma validation errors
    if (err.name === 'PrismaClientValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid data provided',
            code: 'VALIDATION_ERROR',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Handle Multer errors (file upload)
    if (err.name === 'MulterError') {
        const multerError = err as any;

        if (multerError.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large (max 25MB)',
                code: 'FILE_TOO_LARGE'
            });
        }

        if (multerError.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field',
                code: 'INVALID_FILE_FIELD'
            });
        }
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Token has expired',
            code: 'TOKEN_EXPIRED'
        });
    }

    // Default error response
    return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error',
        code: 'INTERNAL_ERROR',
        // STRICT: Never leak stack trace in response
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 

    });
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

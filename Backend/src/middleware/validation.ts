import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Joi schema
 */
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
        });

        if (error) {
            console.error('Validation failed:', JSON.stringify(error.details, null, 2));

            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, '')
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors
            });
        }

        req.body = value;
        next();
    };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, '')
            }));

            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                code: 'VALIDATION_ERROR',
                errors
            });
        }

        req.query = value;
        next();
    };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message.replace(/"/g, '')
            }));

            return res.status(400).json({
                success: false,
                message: 'Invalid parameters',
                code: 'VALIDATION_ERROR',
                errors
            });
        }

        req.params = value;
        next();
    };
};

// ========================================
// VALIDATION SCHEMAS
// ========================================

/**
 * Password validation rules:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/;

export const schemas = {
    // ========================================
    // AUTH SCHEMAS
    // ========================================
    register: Joi.object({
        email: Joi.string()
            .email({ minDomainSegments: 2 })
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),

        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(passwordPattern)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters',
                'string.max': 'Password cannot exceed 128 characters',
                'string.pattern.base': 'Password must contain uppercase, lowercase, number, and a special character',
                'any.required': 'Password is required'
            }),

        name: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
                'string.min': 'Name must be at least 2 characters',
                'string.max': 'Name cannot exceed 50 characters',
                'any.required': 'Name is required'
            }),

        degree: Joi.string()
            .optional()
            .allow(null, '', 'BTech', 'MTech', 'BBA', 'MBA', 'BSc', 'MSc', 'BA', 'MA', 'MCA', 'BCA', 'Other'),

        universityId: Joi.string()
            .uuid()
            .optional(),

        collegeName: Joi.string()
            .max(100)
            .optional(),

        currentSemester: Joi.number()
            .integer()
            .min(1)
            .max(12)
            .optional()
    }),

    login: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            }),

        password: Joi.string()
            .required()
            .messages({
                'any.required': 'Password is required'
            })
    }),

    forgotPassword: Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'any.required': 'Email is required'
            })
    }),

    resetPassword: Joi.object({
        token: Joi.string()
            .required()
            .messages({
                'any.required': 'Reset token is required'
            }),

        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(passwordPattern)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters',
                'string.pattern.base': 'Password must contain uppercase, lowercase, number, and special character'
            })
    }),

    // ========================================
    // NOTE SCHEMAS
    // ========================================
    createNote: Joi.object({
        title: Joi.string()
            .min(5)
            .max(200)
            .trim()
            .required()
            .messages({
                'string.min': 'Title must be at least 5 characters',
                'string.max': 'Title cannot exceed 200 characters',
                'any.required': 'Title is required'
            }),

        description: Joi.string()
            .min(20)
            .max(2000)
            .trim()
            .required()
            .messages({
                'string.min': 'Description must be at least 20 characters',
                'string.max': 'Description cannot exceed 2000 characters',
                'any.required': 'Description is required'
            }),

        subject: Joi.string()
            .min(2)
            .max(100)
            .trim()
            .required()
            .messages({
                'any.required': 'Subject is required'
            }),

        degree: Joi.string()
            .optional()
            .allow(null, '', 'BTech', 'MTech', 'BBA', 'MBA', 'BSc', 'MSc', 'BA', 'MA', 'MCA', 'BCA', 'Other'),

        specialization: Joi.string()
            .max(100)
            .optional()
            .allow(null, ''),

        universityId: Joi.string()
            .optional()
            .allow(null, ''),

        collegeName: Joi.string()
            .max(100)
            .optional()
            .allow(null, ''),

        semester: Joi.number()
            .integer()
            .min(1)
            .max(12)
            .optional()
            .allow(null),

        year: Joi.number()
            .integer()
            .min(1)
            .max(6)
            .optional(),

        language: Joi.string()
            .valid('en', 'hi', 'both')
            .default('en'),

        fileUrl: Joi.string()
            .required()
            .messages({
                'any.required': 'File URL is required'
            }),

        fileType: Joi.string()
            .valid('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            .required()
            .messages({
                'any.only': 'Only PDF and DOCX files are allowed',
                'any.required': 'File type is required'
            }),

        fileSizeBytes: Joi.number()
            .integer()
            .min(1)
            .max(52428800) // 50MB
            .required()
            .messages({
                'number.max': 'File size cannot exceed 50MB',
                'any.required': 'File size is required'
            }),

        totalPages: Joi.number()
            .integer()
            .min(1)
            .max(500)
            .required()
            .messages({
                'number.min': 'Notes must have at least 1 page',
                'number.max': 'Notes cannot exceed 500 pages',
                'any.required': 'Page count is required'
            }),

        priceInr: Joi.number()
            .min(0)
            .max(10000)
            .required()
            .messages({
                'number.min': 'Price cannot be negative',
                'number.max': 'Price cannot exceed ₹10,000',
                'any.required': 'Price is required'
            }),

        previewPages: Joi.array()
            .items(Joi.string())
            .max(6)
            .optional(),

        tableOfContents: Joi.array()
            .items(Joi.string())
            .max(100)
            .optional(),

        tags: Joi.array()
            .items(Joi.string().max(30))
            .max(10)
            .optional(),

        categoryId: Joi.string()
            .optional(),

        coverImage: Joi.string()
            .uri()
            .optional()
            .allow('')
    }),

    updateNote: Joi.object({
        title: Joi.string()
            .min(5)
            .max(200)
            .trim()
            .optional(),

        description: Joi.string()
            .min(20)
            .max(2000)
            .trim()
            .optional(),

        priceInr: Joi.number()
            .min(0)
            .max(10000)
            .precision(2)
            .optional(),

        isActive: Joi.boolean()
            .optional(),

        tableOfContents: Joi.array()
            .items(Joi.string().max(100))
            .max(20)
            .optional(),

        tags: Joi.array()
            .items(Joi.string().max(30))
            .max(10)
            .optional(),

        coverImage: Joi.string()
            .uri()
            .optional()
            .allow('')
    }),

    // ========================================
    // REVIEW SCHEMAS
    // ========================================
    createReview: Joi.object({
        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .required()
            .messages({
                'number.min': 'Rating must be between 1 and 5',
                'number.max': 'Rating must be between 1 and 5',
                'any.required': 'Rating is required'
            }),

        title: Joi.string()
            .min(3)
            .max(100)
            .trim()
            .optional(),

        comment: Joi.string()
            .min(10)
            .max(500)
            .trim()
            .optional()
            .messages({
                'string.min': 'Comment must be at least 10 characters',
                'string.max': 'Comment cannot exceed 500 characters'
            })
    }),

    // ========================================
    // SEARCH SCHEMAS
    // ========================================
    searchQuery: Joi.object({
        query: Joi.string()
            .max(100)
            .optional(),

        degree: Joi.string()
            .optional()
            .allow(null, '', 'BTech', 'MTech', 'BBA', 'MBA', 'BSc', 'MSc', 'BA', 'MA', 'MCA', 'BCA', 'Other'),

        universityId: Joi.string()
            .uuid()
            .optional(),

        categoryId: Joi.string()
            .uuid()
            .optional(),

        semester: Joi.number()
            .integer()
            .min(1)
            .max(12)
            .optional(),

        language: Joi.string()
            .valid('en', 'hi', 'both')
            .optional(),

        minPrice: Joi.number()
            .min(0)
            .optional(),

        maxPrice: Joi.number()
            .min(0)
            .optional(),

        sortBy: Joi.string()
            .valid('recent', 'price_low', 'price_high', 'rating', 'popular')
            .default('recent'),

        page: Joi.number()
            .integer()
            .min(1)
            .default(1),

        limit: Joi.number()
            .integer()
            .min(1)
            .max(1000)
            .default(20)
    }),

    // ========================================
    // PAYMENT SCHEMAS
    // ========================================
    createOrder: Joi.object({
        noteIds: Joi.array()
            .items(Joi.string())
            .min(1)
            .required()
            .messages({
                'array.min': 'Select at least one note',
                'any.required': 'Note IDs are required'
            }),

        couponCode: Joi.string()
            .max(20)
            .optional()
            .allow(null, '')
    }),

    verifyPayment: Joi.object({
        razorpayOrderId: Joi.string()
            .required()
            .messages({
                'any.required': 'Order ID is required'
            }),

        razorpayPaymentId: Joi.string()
            .required()
            .messages({
                'any.required': 'Payment ID is required'
            }),

        razorpaySignature: Joi.string()
            .required()
            .messages({
                'any.required': 'Signature is required'
            })
    }),

    // ========================================
    // CATEGORY SCHEMAS (Admin)
    // ========================================
    createCategory: Joi.object({
        name: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
                'any.required': 'Category name is required'
            }),

        nameHi: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required()
            .messages({
                'any.required': 'Hindi name is required'
            }),

        slug: Joi.string()
            .pattern(/^[a-z0-9-]+$/)
            .max(50)
            .required()
            .messages({
                'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
                'any.required': 'Slug is required'
            }),

        icon: Joi.string()
            .max(10)
            .optional()
    }),

    // ========================================
    // UNIVERSITY SCHEMAS (Admin)
    // ========================================
    createUniversity: Joi.object({
        name: Joi.string()
            .min(5)
            .max(200)
            .trim()
            .required(),

        shortName: Joi.string()
            .min(2)
            .max(20)
            .uppercase()
            .trim()
            .required(),

        state: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required(),

        city: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required(),

        type: Joi.string()
            .valid('Government', 'Private', 'Deemed', 'Central')
            .required(),

        coursesOffered: Joi.array()
            .items(Joi.string().max(50))
            .min(1)
            .required()
    }),

    // ========================================
    // NOTIFICATION SCHEMAS (Admin)
    // ========================================

    /**
     * Send notification to specific users
     * - Max 100 users per request
     * - Control characters rejected
     * - Byte size validated
     */
    sendNotification: Joi.object({
        userIds: Joi.array()
            .items(Joi.string())  // Relaxed from .uuid() to support seed data IDs
            .min(1)
            .max(1000)
            .required()
            .messages({
                'array.min': 'At least one user ID required',
                'array.max': 'Maximum 1000 users per request'
            }),

        type: Joi.string()
            .valid('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ANNOUNCEMENT', 'SYSTEM')
            .required()
            .messages({
                'any.only': 'Invalid notification type',
                'any.required': 'Notification type is required'
            }),

        title: Joi.string()
            .min(3)
            .max(100)
            .trim()
            .pattern(/^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]*$/)  // No control chars
            .required()
            .messages({
                'string.min': 'Title must be at least 3 characters',
                'string.max': 'Title cannot exceed 100 characters',
                'string.pattern.base': 'Title contains invalid characters',
                'any.required': 'Title is required'
            }),

        message: Joi.string()
            .min(10)
            .max(500)
            .trim()
            .pattern(/^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]*$/)  // No control chars
            .required()
            .messages({
                'string.min': 'Message must be at least 10 characters',
                'string.max': 'Message cannot exceed 500 characters',
                'string.pattern.base': 'Message contains invalid characters',
                'any.required': 'Message is required'
            }),

        idempotencyKey: Joi.string()
            .uuid()
            .optional()
    }),

    /**
     * Broadcast notification to all users (async)
     * - Idempotency key REQUIRED (prevents duplicate broadcasts)
     * - Confirmation token required for large broadcasts
     */
    broadcastNotification: Joi.object({
        type: Joi.string()
            .valid('INFO', 'SUCCESS', 'WARNING', 'ANNOUNCEMENT')
            .required()
            .messages({
                'any.only': 'Invalid broadcast type (ERROR and SYSTEM not allowed for broadcast)',
                'any.required': 'Notification type is required'
            }),

        title: Joi.string()
            .min(3)
            .max(100)
            .trim()
            .pattern(/^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]*$/)
            .required()
            .messages({
                'string.min': 'Title must be at least 3 characters',
                'string.max': 'Title cannot exceed 100 characters',
                'string.pattern.base': 'Title contains invalid characters'
            }),

        message: Joi.string()
            .min(10)
            .max(500)
            .trim()
            .pattern(/^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F]*$/)
            .required()
            .messages({
                'string.min': 'Message must be at least 10 characters',
                'string.max': 'Message cannot exceed 500 characters',
                'string.pattern.base': 'Message contains invalid characters'
            }),

        idempotencyKey: Joi.string()
            .uuid()
            .required()
            .messages({
                'any.required': 'Idempotency key is required for broadcasts'
            }),

        confirmationToken: Joi.string()
            .optional()  // Required server-side for broadcasts over threshold
    }),

    /**
     * List notifications query params
     */
    notificationListQuery: Joi.object({
        page: Joi.number()
            .integer()
            .min(1)
            .max(1000)
            .default(1),

        limit: Joi.number()
            .integer()
            .min(1)
            .max(50)  // Capped at 50 for performance
            .default(20),

        type: Joi.string()
            .valid('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'ANNOUNCEMENT', 'SYSTEM', 'PURCHASE', 'SALE', 'APPROVAL')
            .optional(),

        status: Joi.string()
            .valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
            .optional()
    }),

    notificationParams: Joi.object({
        id: Joi.string().required()
    }),

    notificationPreview: Joi.object({
        type: Joi.string()
            .valid('INFO', 'SUCCESS', 'WARNING', 'ANNOUNCEMENT')
            .required(),
        title: Joi.string()
            .min(3)
            .max(100)
            .trim()
            .required(),
        message: Joi.string()
            .min(10)
            .max(500)
            .trim()
            .required(),
        userIds: Joi.array()
            .items(Joi.string())
            .items(Joi.string())
            .max(1000)
            .optional() // Optional, defaults to broadcast if empty/undefined
    }),

    // ========================================
    // CONTACT SCHEMAS
    // ========================================
    createInquiry: Joi.object({
        name: Joi.string()
            .min(2)
            .max(50)
            .trim()
            .required(),
        email: Joi.string()
            .email()
            .required(),
        phone: Joi.string()
            .min(10)
            .max(15)
            .pattern(/^[0-9+\s-]+$/)
            .optional()
            .allow(''),
        subject: Joi.string()
            .min(3)
            .max(100)
            .trim()
            .required(),
        message: Joi.string()
            .min(10)
            .max(2000)
            .trim()
            .required()
    }),

    updateInquiryStatus: Joi.object({
        status: Joi.string()
            .valid('NEW', 'READ', 'REPLIED')
            .required()
    })
};

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string,
        public isOperational: boolean = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(404, `${resource} not found`, 'NOT_FOUND');
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized access') {
        super(401, message, 'UNAUTHORIZED');
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Access forbidden') {
        super(403, message, 'FORBIDDEN');
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class ValidationError extends AppError {
    constructor(message: string, public errors?: any[]) {
        super(400, message, 'VALIDATION_ERROR');
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class PaymentError extends AppError {
    constructor(message: string = 'Payment processing failed') {
        super(402, message, 'PAYMENT_ERROR');
        Object.setPrototypeOf(this, PaymentError.prototype);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(409, message, 'CONFLICT');
        Object.setPrototypeOf(this, ConflictError.prototype);
    }
}

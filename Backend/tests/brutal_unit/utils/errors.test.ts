import { describe, it, expect } from '@jest/globals';
import {
    AppError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ValidationError,
    PaymentError,
    ConflictError
} from '../../../src/utils/errors';

describe('Error Utils - Brutal Unit Tests', () => {

    describe('AppError (Base Class)', () => {
        it('should create an instance with correct properties', () => {
            const error = new AppError(500, 'Test Error', 'TEST_CODE');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(500);
            expect(error.message).toBe('Test Error');
            expect(error.code).toBe('TEST_CODE');
            expect(error.isOperational).toBe(true); // Default true
            expect(error.stack).toBeDefined();
        });

        it('should accept isOperational override', () => {
            const error = new AppError(500, 'Fatal', 'FATAL', false);
            expect(error.isOperational).toBe(false);
        });
    });

    describe('NotFoundError', () => {
        it('should have 404 status and default message', () => {
            const error = new NotFoundError();
            expect(error).toBeInstanceOf(AppError);
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
            expect(error.message).toBe('Resource not found');
        });

        it('should accept custom resource name', () => {
            const error = new NotFoundError('User');
            expect(error.message).toBe('User not found');
        });
    });

    describe('UnauthorizedError', () => {
        it('should have 401 status', () => {
            const error = new UnauthorizedError();
            expect(error.statusCode).toBe(401);
            expect(error.code).toBe('UNAUTHORIZED');
            expect(error.message).toBe('Unauthorized access');
        });

        it('should custom message', () => {
            const error = new UnauthorizedError('Custom');
            expect(error.message).toBe('Custom');
        });
    });

    describe('ForbiddenError', () => {
        it('should have 403 status', () => {
            const error = new ForbiddenError();
            expect(error.statusCode).toBe(403);
            expect(error.code).toBe('FORBIDDEN');
            expect(error.message).toBe('Access forbidden');
        });
    });

    describe('ValidationError', () => {
        it('should have 400 status and errors array', () => {
            const details = [{ field: 'email', msg: 'invalid' }];
            const error = new ValidationError('Bad Input', details);

            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.message).toBe('Bad Input');
            expect(error.errors).toEqual(details);
        });

        it('should handle undefined errors array', () => {
            const error = new ValidationError('Bad Input');
            expect(error.errors).toBeUndefined();
        });
    });

    describe('PaymentError', () => {
        it('should have 402 status', () => {
            const error = new PaymentError();
            expect(error.statusCode).toBe(402);
            expect(error.code).toBe('PAYMENT_ERROR');
        });
    });

    describe('ConflictError', () => {
        it('should have 409 status', () => {
            const error = new ConflictError();
            expect(error.statusCode).toBe(409);
            expect(error.code).toBe('CONFLICT');
        });
    });
});

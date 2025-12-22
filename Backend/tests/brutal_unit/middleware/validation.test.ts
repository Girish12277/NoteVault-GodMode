// @ts-nocheck
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import Joi from 'joi'; // Using real Joi for integration-like unit test of middleware logic
import { validate, validateQuery, validateParams } from '../../../src/middleware/validation';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('Validation Middleware - Brutal Unit Tests', () => {
    let req: any;
    let res: any;
    let next: any;

    const testSchema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().min(18)
    });

    beforeEach(() => {
        req = {
            body: {},
            query: {},
            params: {}
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    describe('validate (Body)', () => {
        const middleware = validate(testSchema);

        it('should call next() for valid body', () => {
            req.body = { name: 'John', age: 25 };
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.body).toEqual({ name: 'John', age: 25 });
        });

        it('should strip unknown fields', () => {
            req.body = { name: 'John', extra: 'field' };
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(req.body).toEqual({ name: 'John' }); // extra removed
            expect(req.body.extra).toBeUndefined();
        });

        it('should return 400 for invalid body', () => {
            req.body = { age: 10 }; // Missing name, age < 18
            middleware(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                code: 'VALIDATION_ERROR',
                errors: expect.any(Array)
            }));
            // Verify error details
            const calls = res.json.mock.calls[0][0];
            expect(calls.errors).toHaveLength(2); // name required, age min
        });
    });

    describe('validateQuery', () => {
        const middleware = validateQuery(testSchema);

        it('should call next() for valid query', () => {
            req.query = { name: 'John', age: 30 };
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should return 400 for invalid query', () => {
            req.query = { age: 'not_number' };
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('validateParams', () => {
        const middleware = validateParams(testSchema);

        it('should call next() for valid params', () => {
            req.params = { name: 'John' };
            middleware(req, res, next);
            expect(next).toHaveBeenCalled();
        });

        it('should return 400 for invalid params', () => {
            req.params = {};
            middleware(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

});

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { correlationIdMiddleware } from '../../../src/middleware/correlationId';

describe('CorrelationId - Brutal Unit Tests', () => {
    let req: Partial<Request> & { correlationId?: string };
    let res: Partial<Response>;
    let next: NextFunction;
    let setMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        setMock = jest.fn();
        next = jest.fn();

        req = { headers: {} };
        res = { set: setMock as any, setHeader: setMock as any, on: jest.fn() as any };
    });

    it('should generate correlation ID if not provided', () => {
        correlationIdMiddleware(req as Request, res as Response, next);

        expect(req.correlationId).toBeDefined();
        expect(typeof req.correlationId).toBe('string');
        expect(setMock).toHaveBeenCalledWith('X-Correlation-ID', req.correlationId);
        expect(next).toHaveBeenCalled();
    });

    it('should use existing correlation ID from header', () => {
        req.headers = { 'x-correlation-id': 'existing-id-123' };

        correlationIdMiddleware(req as Request, res as Response, next);

        expect(req.correlationId).toBe('existing-id-123');
        expect(setMock).toHaveBeenCalledWith('X-Correlation-ID', 'existing-id-123');
    });

    it('should handle case-insensitive header', () => {
        req.headers = { 'x-request-id': 'request-id-789' };

        correlationIdMiddleware(req as Request, res as Response, next);

        expect(req.correlationId).toBe('request-id-789');
    });
});

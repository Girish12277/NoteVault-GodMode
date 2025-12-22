import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { downloadKillSwitch, featureFlags } from '../../../src/middleware/killSwitch';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('KillSwitch - Brutal Unit Tests', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });
        next = jest.fn();

        req = {};
        res = { status: statusMock as any, json: jsonMock as any };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('downloadKillSwitch', () => {
        it('should allow when both flags enabled', () => {
            process.env.ENABLE_DOWNLOADS = 'true';
            process.env.SIGNED_URLS_ENABLED = 'true';

            downloadKillSwitch(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('should return 503 when downloads disabled', () => {
            process.env.ENABLE_DOWNLOADS = 'false';
            process.env.SIGNED_URLS_ENABLED = 'true';

            downloadKillSwitch(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(503);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                code: 'MAINTENANCE'
            }));
        });

        it('should return 503 when signed URLs disabled', () => {
            process.env.ENABLE_DOWNLOADS = 'true';
            process.env.SIGNED_URLS_ENABLED = 'false';

            downloadKillSwitch(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(503);
        });

        it('should return 503 when both disabled', () => {
            process.env.ENABLE_DOWNLOADS = 'false';
            process.env.SIGNED_URLS_ENABLED = 'false';

            downloadKillSwitch(req as Request, res as Response, next);

            expect(statusMock).toHaveBeenCalledWith(503);
        });
    });
});

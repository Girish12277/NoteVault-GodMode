// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/disputeRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/disputeRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register dispute/resolution routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

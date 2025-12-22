// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/analyticsRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/analyticsRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register admin analytics routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

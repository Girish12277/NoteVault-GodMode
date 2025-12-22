// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/orderRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/orderRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register order/purchase routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

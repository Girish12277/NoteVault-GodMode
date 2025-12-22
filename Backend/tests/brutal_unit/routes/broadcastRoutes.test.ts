// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/broadcastRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/broadcastRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register broadcast routes (admin)', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

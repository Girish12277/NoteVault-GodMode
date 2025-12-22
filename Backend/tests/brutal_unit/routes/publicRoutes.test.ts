// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/publicRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/publicRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register public routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/contentRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/contentRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register CMS routes (admin)', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

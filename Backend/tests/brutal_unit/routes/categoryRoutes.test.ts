// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/categoryRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/categoryRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register GET / (list categories)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register POST / (create category - admin)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });
});

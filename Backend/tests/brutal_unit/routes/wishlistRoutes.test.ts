// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/wishlistRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/wishlistRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register POST /:noteId (toggle wishlist)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:noteId' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should register GET / (list wishlist)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });
});

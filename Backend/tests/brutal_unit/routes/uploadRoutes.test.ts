// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/uploadRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/uploadRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register POST /note', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/note' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        // Should have authenticate + requireSeller + uploadLimiter + upload middleware
        expect(route.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('should register POST /preview', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/preview' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('should register POST /avatar', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/avatar' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        // Should have authenticate + uploadLimiter + upload middleware
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should register DELETE /:publicId(*)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:publicId(*)' && layer.route?.methods?.delete
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should register GET /signed-url/:publicId(*)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/signed-url/:publicId(*)' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });
});

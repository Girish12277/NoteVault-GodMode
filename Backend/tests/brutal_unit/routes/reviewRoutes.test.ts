// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/reviewRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/reviewRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register GET /:noteId (get reviews for note)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:noteId' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register POST /:noteId (create review)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:noteId' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });
});

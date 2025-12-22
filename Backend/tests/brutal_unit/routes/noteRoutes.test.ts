// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/noteRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/noteRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register GET / (list notes)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
        // Should have optionalAuthenticate + validateQuery + controller
        expect(route.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('should register GET /:id (get note by ID)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:id' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register GET /:id/download (download note)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:id/download' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
        // Should have authenticate middleware
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should register POST / (create note)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        // Should have authenticate + requireSeller + uploadNoteFields + validate + controller
        expect(route.route.stack.length).toBeGreaterThanOrEqual(4);
    });

    it('should register PUT /:id (update note)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:id' && layer.route?.methods?.put
        );
        expect(route).toBeDefined();
    });

    it('should register DELETE /:id (delete note)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:id' && layer.route?.methods?.delete
        );
        expect(route).toBeDefined();
    });
});

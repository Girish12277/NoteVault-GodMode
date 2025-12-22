// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/paymentRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/paymentRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register POST /create-order', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/create-order' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        // Should have authenticate + validate + controller
        expect(route.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('should register POST /verify', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/verify' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(3);
    });

    it('should register GET /transactions', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/transactions' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
        // Should have authenticate + controller
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should register GET /invoice/:paymentId', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/invoice/:paymentId' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });
});

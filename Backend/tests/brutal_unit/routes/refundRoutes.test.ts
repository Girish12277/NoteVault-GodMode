// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/refundRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/refundRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register POST /initiate (user refund request)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/initiate' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should register GET /my-refunds', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/my-refunds' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register GET /:refundId (get refund details)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/:refundId' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register admin routes', () => {
        const pendingRoute = router.stack.find((layer: any) =>
            layer.route?.path === '/admin/pending' && layer.route?.methods?.get
        );
        const approveRoute = router.stack.find((layer: any) =>
            layer.route?.path === '/admin/:refundId/approve' && layer.route?.methods?.post
        );
        const rejectRoute = router.stack.find((layer: any) =>
            layer.route?.path === '/admin/:refundId/reject' && layer.route?.methods?.post
        );

        expect(pendingRoute).toBeDefined();
        expect(approveRoute).toBeDefined();
        expect(rejectRoute).toBeDefined();
    });
});

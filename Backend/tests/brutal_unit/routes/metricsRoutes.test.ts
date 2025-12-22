// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/metricsRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/metricsRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register GET / (Prometheus metrics)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register GET /json (JSON metrics)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/json' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });
});

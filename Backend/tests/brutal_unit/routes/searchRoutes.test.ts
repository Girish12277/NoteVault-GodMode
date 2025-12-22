// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/searchRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/searchRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register GET / (smart search)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });

    it('should register GET /autocomplete', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/autocomplete' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });
});

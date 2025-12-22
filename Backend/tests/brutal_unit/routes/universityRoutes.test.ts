// @ts-not check
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('Routes/universityRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/universityRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register GET / (list universities)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.get
        );
        expect(route).toBeDefined();
    });
});

// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/contactRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/contactRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register POST / (submit contact form)', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });
});

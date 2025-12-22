// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/webhookRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/webhookRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register webhook routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

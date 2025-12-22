// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/downloadRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/downloadRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register download routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

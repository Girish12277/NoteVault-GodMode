// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/postsRouter - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/postsRouter').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register social posts routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/messagesRouter - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/messagesRouter').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register messaging routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
    });
});

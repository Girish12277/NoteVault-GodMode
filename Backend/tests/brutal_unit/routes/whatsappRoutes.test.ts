// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/whatsappRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        router = require('../../../src/routes/whatsappRoutes').default;
    });

    it('should export Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register WhatsApp admin routes', () => {
        expect(router.stack.length).toBeGreaterThan(0);
        // Routes: /stats, /test, /messages, /webhook
    });
});

// @ts-nocheck
import { describe, it, expect } from '@jest/globals';

describe('Routes/additionalRoutes - Route Registration Tests', () => {
    let sellerRouter: any;
    let adminRouter: any;
    let cartRouter: any;
    let orderRouter: any;

    beforeAll(() => {
        const routes = require('../../../src/routes/additionalRoutes');
        sellerRouter = routes.sellerRouter;
        adminRouter = routes.adminRouter;
        cartRouter = routes.cartRouter;
        orderRouter = routes.orderRouter;
    });

    it('should export Express Router instances', () => {
        expect(sellerRouter).toBeDefined();
        expect(adminRouter).toBeDefined();
        expect(cartRouter).toBeDefined();
        expect(orderRouter).toBeDefined();
    });

    it('should register seller routes', () => {
        expect(sellerRouter.stack).toBeDefined();
        expect(sellerRouter.stack.length).toBeGreaterThan(0);
    });

    it('should register admin routes', () => {
        expect(adminRouter.stack).toBeDefined();
        expect(adminRouter.stack.length).toBeGreaterThan(0);
    });

    it('should register cart routes', () => {
        expect(cartRouter.stack).toBeDefined();
    });

    it('should register order routes', () => {
        expect(orderRouter.stack).toBeDefined();
    });
});

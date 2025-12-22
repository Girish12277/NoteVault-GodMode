// @ts-nocheck
import { describe, it, expect } from '@jest/globals';
import { Router } from 'express';

describe('Routes/authRoutes - Route Registration Tests', () => {
    let router: any;

    beforeAll(() => {
        // Import the actual router
        router = require('../../../src/routes/authRoutes').default;
    });

    it('should export an Express Router instance', () => {
        expect(router).toBeDefined();
        expect(router.stack).toBeDefined();
    });

    it('should register POST /register', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/register' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
        expect(route.route.stack.length).toBeGreaterThan(0);
    });

    it('should register POST /login', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/login' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });

    it('should register POST /refresh', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/refresh' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });

    it('should register POST /forgot-password', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/forgot-password' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });

    it('should register POST /reset-password', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/reset-password' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });

    it('should register POST /logout', () => {
        const route = router.stack.find((layer: any) =>
            layer.route?.path === '/logout' && layer.route?.methods?.post
        );
        expect(route).toBeDefined();
    });

    it('should register Email OTP routes', () => {
        const sendEmailOTP = router.stack.find((layer: any) =>
            layer.route?.path === '/send-email-otp' && layer.route?.methods?.post
        );
        const verifyEmailOTP = router.stack.find((layer: any) =>
            layer.route?.path === '/verify-email-otp' && layer.route?.methods?.post
        );
        const resendEmailOTP = router.stack.find((layer: any) =>
            layer.route?.path === '/resend-email-otp' && layer.route?.methods?.post
        );

        expect(sendEmailOTP).toBeDefined();
        expect(verifyEmailOTP).toBeDefined();
        expect(resendEmailOTP).toBeDefined();
    });

    it('should register Mobile OTP routes', () => {
        const sendMobileOTP = router.stack.find((layer: any) =>
            layer.route?.path === '/send-mobile-otp' && layer.route?.methods?.post
        );
        const verifyMobileOTP = router.stack.find((layer: any) =>
            layer.route?.path === '/verify-mobile-otp' && layer.route?.methods?.post
        );

        expect(sendMobileOTP).toBeDefined();
        expect(verifyMobileOTP).toBeDefined();
    });

    it('should register OAuth GET routes', () => {
        const googleAuth = router.stack.find((layer: any) =>
            layer.route?.path === '/google' && layer.route?.methods?.get
        );
        const googleCallback = router.stack.find((layer: any) =>
            layer.route?.path === '/google/callback' && layer.route?.methods?.get
        );

        expect(googleAuth).toBeDefined();
        expect(googleCallback).toBeDefined();
    });

    it('should register protected routes (GET /me, PUT /profile, POST /become-seller)', () => {
        const getMe = router.stack.find((layer: any) =>
            layer.route?.path === '/me' && layer.route?.methods?.get
        );
        const updateProfile = router.stack.find((layer: any) =>
            layer.route?.path === '/profile' && layer.route?.methods?.put
        );
        const becomeSeller = router.stack.find((layer: any) =>
            layer.route?.path === '/become-seller' && layer.route?.methods?.post
        );

        expect(getMe).toBeDefined();
        expect(updateProfile).toBeDefined();
        expect(becomeSeller).toBeDefined();
    });

    it('should have middleware on protected routes', () => {
        const getMe = router.stack.find((layer: any) =>
            layer.route?.path === '/me' && layer.route?.methods?.get
        );

        // Protected routes should have at least 2 handlers (auth middleware + controller)
        expect(getMe.route.stack.length).toBeGreaterThanOrEqual(2);
    });

    it('should have rate limiters on auth routes', () => {
        const register = router.stack.find((layer: any) =>
            layer.route?.path === '/register' && layer.route?.methods?.post
        );

        // Should have multiple middleware (rate limiter + validation + controller)
        expect(register.route.stack.length).toBeGreaterThanOrEqual(3);
    });
});

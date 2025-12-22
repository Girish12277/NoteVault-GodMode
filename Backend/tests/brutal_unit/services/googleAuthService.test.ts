import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import jwt from 'jsonwebtoken';

const mockPrisma = {
    users: {
        findUnique: jest.fn() as any,
        update: jest.fn() as any,
        create: jest.fn() as any,
    },
    device_sessions: {
        create: jest.fn() as any,
    },
};

jest.mock('../../../src/config/database', () => ({
    __esModule: true,
    prisma: mockPrisma
}));

// Mock passport to avoid initialization errors
jest.mock('passport', () => ({
    use: jest.fn(),
}));
jest.mock('passport-google-oauth20', () => ({
    Strategy: jest.fn(),
}));

import { googleAuthService } from '../../../src/services/googleAuthService';

describe('GoogleAuthService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup env vars for JWT
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('handleGoogleCallback (via private access)', () => {
        it('should link to existing user with same email', async () => {
            const existingUser = { id: 'user_123', email: 'test@example.com' };
            (mockPrisma.users.findUnique as any)
                .mockResolvedValueOnce(null) // Not found by google_id
                .mockResolvedValueOnce(existingUser); // Found by email
            (mockPrisma.users.update as any).mockResolvedValue({ ...existingUser, google_id: 'g_123' });

            const done = jest.fn();
            const profile = { id: 'g_123', emails: [{ value: 'test@example.com' }] };

            await (googleAuthService as any).handleGoogleCallback('token', 'refresh', profile, done);

            expect(mockPrisma.users.update).toHaveBeenCalled();
            expect(done).toHaveBeenCalledWith(null, expect.anything());
        });

        it('should create new user if not found', async () => {
            (mockPrisma.users.findUnique as any).mockResolvedValue(null); // Not found
            (mockPrisma.users.create as any).mockResolvedValue({ id: 'new_user', email: 'new@example.com' });

            const done = jest.fn();
            const profile = { id: 'g_new', emails: [{ value: 'new@example.com' }], displayName: 'New User' };

            await (googleAuthService as any).handleGoogleCallback('token', 'refresh', profile, done);

            expect(mockPrisma.users.create).toHaveBeenCalled();
            expect(done).toHaveBeenCalledWith(null, expect.anything());
        });
    });

    describe('processGoogleAuth', () => {
        it('should generate tokens for user', async () => {
            const user = { id: 'user_123', email: 'test@example.com', full_name: 'Test', is_admin: false };
            (mockPrisma.device_sessions.create as any).mockResolvedValue({});

            const result = await googleAuthService.processGoogleAuth(user);

            expect(result.success).toBe(true);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(mockPrisma.device_sessions.create).toHaveBeenCalled();
        });
    });

    describe('linkGoogleAccount', () => {
        it('should link google account', async () => {
            (mockPrisma.users.findUnique as any).mockResolvedValue(null); // No existing google user
            (mockPrisma.users.update as any).mockResolvedValue({});

            const result = await googleAuthService.linkGoogleAccount('user_123', 'g_123', 'test@google.com');

            expect(result.success).toBe(true);
            expect(mockPrisma.users.update).toHaveBeenCalled();
        });
    });

    describe('unlinkGoogleAccount', () => {
        it('should prevent unlink if no password set', async () => {
            (mockPrisma.users.findUnique as any).mockResolvedValue({ id: 'user_123', google_id: 'g_123', password_hash: null });

            const result = await googleAuthService.unlinkGoogleAccount('user_123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('set a password first');
        });
    });
});

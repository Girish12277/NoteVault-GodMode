// tests/setup.ts
import { jest } from '@jest/globals';

// Quiet console during tests
global.console = {
    ...console,
    // log: jest.fn(), // Keep log for debugging if needed, or mock it to silence
    // error: jest.fn(), 
    warn: jest.fn(),
};

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ADMIN_PASSWORD = 'secure-test-admin-password';
process.env.NODE_ENV = 'test';

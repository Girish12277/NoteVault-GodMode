// @ts-nocheck
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

const mockSwaggerJsdoc = jest.fn(() => ({ openapi: '3.0.0' }));
const mockServe = jest.fn();
const mockSetup = jest.fn(() => 'setupMiddleware');


jest.mock('swagger-jsdoc', () => mockSwaggerJsdoc);
jest.mock('swagger-ui-express', () => ({
    serve: mockServe,
    setup: mockSetup
}));

describe('Config/Swagger - Brutal Unit Tests', () => {
    let originalEnv: NodeJS.ProcessEnv;
    let mockApp: any;

    beforeEach(() => {
        jest.resetModules();
        originalEnv = { ...process.env };

        mockApp = {
            use: jest.fn(),
            get: jest.fn()
        };

        mockSwaggerJsdoc.mockClear();
        mockServe.mockClear();
        mockSetup.mockClear();

        // Suppress logs
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    const reImport = () => require('../../../src/config/swagger');

    it('should generate swagger spec on load', () => {
        reImport();
        expect(mockSwaggerJsdoc).toHaveBeenCalledWith(expect.objectContaining({
            swaggerDefinition: expect.objectContaining({
                openapi: '3.0.0',
                info: expect.objectContaining({ title: 'StudyVault API' })
            })
        }));
    });

    it('should setup swagger UI in development', () => {
        process.env.NODE_ENV = 'development';
        const { setupSwagger } = reImport();

        setupSwagger(mockApp);

        expect(mockApp.use).toHaveBeenCalledWith('/api-docs', mockServe, expect.anything());
        expect(mockSetup).toHaveBeenCalled();
        expect(mockApp.get).toHaveBeenCalledWith('/api-docs.json', expect.any(Function));
    });

    it('should NOT setup swagger UI in production (Security)', () => {
        process.env.NODE_ENV = 'production';
        const { setupSwagger } = reImport();

        setupSwagger(mockApp);

        expect(mockApp.use).not.toHaveBeenCalled();
        expect(mockApp.get).not.toHaveBeenCalled();
    });

    it('should serve JSON spec', () => {
        process.env.NODE_ENV = 'development';
        const { setupSwagger } = reImport();

        setupSwagger(mockApp);

        const call = mockApp.get.mock.calls.find((c: any) => c[0] === '/api-docs.json');
        expect(call).toBeDefined();

        const req = {};
        const res = {
            setHeader: jest.fn(),
            send: jest.fn()
        };

        // Execute the handler
        call[1](req, res);

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
        expect(res.send).toHaveBeenCalled();
    });
});

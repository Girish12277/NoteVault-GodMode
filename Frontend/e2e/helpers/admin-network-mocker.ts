/**
 * ADMIN NETWORK MOCKER
 * Mock all HTTP states for frontend testing
 */

import { rest } from 'msw';
import { setupServer } from 'msw/node';

export class AdminNetworkMocker {
    private static server: any;

    /**
     * Setup MSW server for mocking
     */
    static setupMockServer(): void {
        this.server = setupServer();
        this.server.listen({ onUnhandledRequest: 'bypass' });
    }

    /**
     * Reset all handlers
     */
    static resetHandlers(): void {
        this.server.resetHandlers();
    }

    /**
     * Close server
     */
    static closeMockServer(): void {
        this.server.close();
    }

    /**
     * Mock 200 success response
     */
    static mock200(endpoint: string, responseData: any): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(ctx.status(200), ctx.json(responseData));
            })
        );
    }

    /**
     * Mock 400 bad request
     */
    static mock400(endpoint: string, errorMessage: string = 'Bad Request'): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(
                    ctx.status(400),
                    ctx.json({ success: false, code: 'BAD_REQUEST', message: errorMessage })
                );
            })
        );
    }

    /**
     * Mock 401 unauthorized (clears token, redirects to login)
     */
    static mock401(endpoint: string): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(
                    ctx.status(401),
                    ctx.json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid or expired token' })
                );
            })
        );
    }

    /**
     * Mock 403 forbidden (access denied)
     */
    static mock403(endpoint: string): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(
                    ctx.status(403),
                    ctx.json({ success: false, code: 'FORBIDDEN', message: 'Access denied. Admin only.' })
                );
            })
        );
    }

    /**
     * Mock 429 rate limit
     */
    static mock429(endpoint: string, retryAfter: number = 60): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(
                    ctx.status(429),
                    ctx.set('Retry-After', retryAfter.toString()),
                    ctx.json({ success: false, code: 'RATE_LIMIT', message: `Too many requests. Retry in ${retryAfter}s` })
                );
            })
        );
    }

    /**
     * Mock 500 server error
     */
    static mock500(endpoint: string): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(
                    ctx.status(500),
                    ctx.json({ success: false, code: 'SERVER_ERROR', message: 'Internal server error' })
                );
            })
        );
    }

    /**
     * Mock network timeout
     */
    static mockTimeout(endpoint: string, delayMs: number = 30000): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, async (req, res, ctx) => {
                await ctx.delay(delayMs);
                return res.networkError('Network timeout');
            })
        );
    }

    /**
     * Mock network error (connection lost)
     */
    static mockNetworkError(endpoint: string): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res) => {
                return res.networkError('Failed to connect');
            })
        );
    }

    /**
     * Mock malformed JSON response
     */
    static mockMalformedJSON(endpoint: string): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, (req, res, ctx) => {
                return res(ctx.status(200), ctx.text('{invalid json}'));
            })
        );
    }

    /**
     * Mock slow response (latency)
     */
    static mockSlowResponse(endpoint: string, delayMs: number, responseData: any): void {
        this.server.use(
            rest.get(`http://localhost:5001${endpoint}`, async (req, res, ctx) => {
                await ctx.delay(delayMs);
                return res(ctx.status(200), ctx.json(responseData));
            })
        );
    }
}

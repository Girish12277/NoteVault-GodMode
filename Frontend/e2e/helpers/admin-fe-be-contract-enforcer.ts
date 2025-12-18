/**
 * ADMIN FE↔BE CONTRACT ENFORCER
 * Ultra-strict schema validation for admin panel communication
 */

import Ajv, { ValidateFunction } from 'ajv';
import { expect } from '@playwright/test';

const ajv = new Ajv({ allErrors: true });

export class AdminFEBEContractEnforcer {
    /**
     * Validate exact request schema - FE must send exactly this
     */
    static validateRequestSchema(request: any, expectedSchema: object): void {
        const validate = ajv.compile(expectedSchema);
        const valid = validate(request);

        if (!valid) {
            throw new Error(`Request schema violation: ${JSON.stringify(validate.errors)}`);
        }
    }

    /**
     * Validate exact response schema - BE must return exactly this
     */
    static validateResponseSchema(response: any, expectedSchema: object): void {
        const validate = ajv.compile(expectedSchema);
        const valid = validate(response);

        if (!valid) {
            throw new Error(`Response schema violation: ${JSON.stringify(validate.errors)}`);
        }

        // Check NO extra properties
        this.checkNoExtraProperties(response, expectedSchema);
    }

    /**
     * Validate required headers - both directions
     */
    static validateRequiredHeaders(headers: Record<string, string>, required: string[]): void {
        required.forEach(header => {
            const headerLower = header.toLowerCase();
            const hasHeader = Object.keys(headers).some(h => h.toLowerCase() === headerLower);

            if (!hasHeader) {
                throw new Error(`Missing required header: ${header}`);
            }
        });
    }

    /**
     * Validate security headers
     */
    static validateSecurityHeaders(headers: Record<string, string>): void {
        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['x-frame-options']).toBeTruthy();
        expect(headers['strict-transport-security']).toBeTruthy();
    }

    /**
     * Validate timing (prevent timing attacks)
     */
    static validateTiming(startTime: number, endTime: number, maxMs: number): void {
        const duration = endTime - startTime;
        if (duration > maxMs) {
            throw new Error(`Request took ${duration}ms, expected < ${maxMs}ms`);
        }
    }

    /**
     * Validate HTTP status code
     */
    static validateStatusCode(actual: number, expected: number | number[]): void {
        const expectedArray = Array.isArray(expected) ? expected : [expected];
        if (!expectedArray.includes(actual)) {
            throw new Error(`Expected status ${expected}, got ${actual}`);
        }
    }

    /**
     * Validate request correlation ID is mirrored
     */
    static validateCorrelationID(requestID: string, responseID: string): void {
        expect(responseID).toBe(requestID);
    }

    /**
     * Check no extra properties in response
     */
    private static checkNoExtraProperties(data: any, schema: any): void {
        if (schema.additionalProperties === false) {
            const allowed = Object.keys(schema.properties || {});
            const actual = Object.keys(data);
            const extra = actual.filter(k => !allowed.includes(k));

            if (extra.length > 0) {
                throw new Error(`Extra properties found: ${extra.join(', ')}`);
            }
        }
    }

    /**
     * Admin users list response schema
     */
    static get AdminUsersResponseSchema() {
        return {
            type: 'object',
            required: ['success', 'data'],
            properties: {
                success: { type: 'boolean', const: true },
                data: {
                    type: 'object',
                    required: ['users', 'total', 'page', 'limit'],
                    properties: {
                        users: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['id', 'email', 'fullName', 'isActive', 'createdAt'],
                                properties: {
                                    id: { type: 'string' },
                                    email: { type: 'string' },
                                    fullName: { type: 'string' },
                                    isAdmin: { type: 'boolean' },
                                    isSeller: { type: 'boolean' },
                                    isActive: { type: 'boolean' },
                                    createdAt: { type: 'string' },
                                    lastLogin: { type: ['string', 'null'] }
                                },
                                additionalProperties: false
                            }
                        },
                        total: { type: 'number', minimum: 0 },
                        page: { type: 'number', minimum: 1 },
                        limit: { type: 'number', minimum: 1, maximum: 100 }
                    },
                    additionalProperties: false
                }
            },
            additionalProperties: false
        };
    }

    /**
     * Error response schema
     */
    static get ErrorResponseSchema() {
        return {
            type: 'object',
            required: ['success', 'code', 'message'],
            properties: {
                success: { type: 'boolean', const: false },
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object' }
            },
            additionalProperties: false
        };
    }
}

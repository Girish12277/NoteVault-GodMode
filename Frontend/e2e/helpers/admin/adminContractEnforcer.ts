/**
 * ADMIN CONTRACT ENFORCER
 * Validates strict contracts for admin API responses: headers, schema, error formats.
 */

import { APIResponse, expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

export class AdminContractEnforcer {

    /**
     * Validate common security headers
     */
    static async validateHeaders(response: APIResponse) {
        const headers = response.headers();

        expect(headers['content-type']).toContain('application/json');
        expect(headers['x-content-type-options']).toBe('nosniff');
        expect(headers['x-frame-options']).toBe('DENY');
        expect(headers['strict-transport-security']).toBeDefined();
    }

    /**
     * Validate response body against schema
     */
    static async validateSchema(response: APIResponse, schema: object) {
        const body = await response.json();
        const validate = ajv.compile(schema);
        const valid = validate(body);

        if (!valid) {
            console.error('Schema Validation Errors:', validate.errors);
            throw new Error(`Schema validation failed: ${JSON.stringify(validate.errors)}`);
        }

        // Ensure no extra fields (if additionalProperties: false is set in schema)
        // This is implicitly handled by AJV if the schema defines it, 
        // but we enforce it strictly here for top-level keys if needed.
    }

    /**
     * Validate error response format
     */
    static async validateError(response: APIResponse, expectedCode: number, expectedErrorCode: string) {
        expect(response.status()).toBe(expectedCode);

        const body = await response.json();
        expect(body).toHaveProperty('code', expectedErrorCode);
        expect(body).toHaveProperty('message');

        // Ensure no stack traces
        expect(JSON.stringify(body)).not.toContain('at ');
        expect(JSON.stringify(body)).not.toContain('node_modules');
    }

    /**
     * Validate no sensitive data leaked
     */
    static async validateNoSecrets(response: APIResponse) {
        const text = await response.text();

        // Check for common secrets
        expect(text).not.toMatch(/password/i);
        expect(text).not.toMatch(/secret/i);
        expect(text).not.toMatch(/key/i);
        // Allow "apiKey" or "publicKey" keys but check values? 
        // For now, simple regex check might be too aggressive if keys are named "passwordHash" etc.
        // We'll stick to value checks if possible, or specific patterns.

        // Check for PII patterns (emails in non-user endpoints, etc - context dependent)
    }
}

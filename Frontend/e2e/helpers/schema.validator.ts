/**
 * SCHEMA VALIDATOR - Exact API schema validation
 * Addresses Gap: API schema validation missing
 */

import { expect } from '@playwright/test';

export class SchemaValidator {
    /**
     * Validate exact schema match - NO extra fields allowed
     */
    static validateExactSchema(data: any, schema: any): void {
        // Check all required fields present
        for (const key of schema.required || []) {
            expect(data).toHaveProperty(key);
        }

        // Check NO extra fields
        const allowedKeys = Object.keys(schema.properties || {});
        const actualKeys = Object.keys(data);

        const extraKeys = actualKeys.filter(k => !allowedKeys.includes(k));
        expect(extraKeys).toEqual([]);

        // Type validation
        for (const [key, value] of Object.entries(data)) {
            const expectedType = schema.properties[key]?.type;
            if (expectedType) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                expect(actualType).toBe(expectedType);
            }
        }
    }

    /**
     * Validate no null in non-nullable fields
     */
    static validateNoNulls(data: any, nonNullableFields: string[]): void {
        for (const field of nonNullableFields) {
            if (field in data) {
                expect(data[field]).not.toBeNull();
                expect(data[field]).not.toBeUndefined();
            }
        }
    }

    /**
     * Validate camelCase vs snake_case consistency
     */
    static validateCasing(data: any, expectedCasing: 'camelCase' | 'snake_case'): void {
        const keys = Object.keys(data);

        for (const key of keys) {
            if (expectedCasing === 'camelCase') {
                // Should NOT have underscores
                expect(key).not.toMatch(/_/);
            } else {
                // Should use underscores, not camelCase
                expect(key).toMatch(/^[a-z_]+$/);
            }
        }
    }

    /**
     * Validate error code is in allowed enum
     */
    static validateErrorCode(code: string, allowedCodes: string[]): void {
        expect(allowedCodes).toContain(code);
        expect(code).toMatch(/^[A-Z_]+$/); // UPPER_SNAKE_CASE
    }
}

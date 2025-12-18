/**
 * IDEMPOTENCY HELPER
 * Generates idempotency keys and validates idempotent behavior.
 */

import { APIRequestContext, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

export class IdempotencyHelper {

    /**
     * Generate a unique idempotency key
     */
    static generateKey(): string {
        return uuidv4();
    }

    /**
     * Execute idempotent request twice and assert same result
     */
    static async assertIdempotency(
        request: APIRequestContext,
        method: 'POST' | 'PUT' | 'DELETE' | 'PATCH',
        url: string,
        payload: any,
        headers: any = {}
    ) {
        const key = this.generateKey();
        const requestHeaders = { ...headers, 'Idempotency-Key': key };

        // First Request
        const response1 = await request.fetch(url, {
            method,
            data: payload,
            headers: requestHeaders
        });
        const body1 = await response1.json();
        const status1 = response1.status();

        // Second Request (Same Key)
        const response2 = await request.fetch(url, {
            method,
            data: payload,
            headers: requestHeaders
        });
        const body2 = await response2.json();
        const status2 = response2.status();

        // Assertions
        expect(status1).toBe(status2);
        expect(body1).toEqual(body2);

        return { response: response1, body: body1 };
    }
}

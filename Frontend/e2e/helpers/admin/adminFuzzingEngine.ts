/**
 * ADMIN FUZZING ENGINE
 * Generates deterministic, seeded fuzz inputs for hostile testing.
 */

import { expect } from '@playwright/test';
import * as crypto from 'crypto';

export class AdminFuzzingEngine {
    private seed: number;

    constructor(seed: number = Date.now()) {
        this.seed = seed;
        console.log(`[FUZZ] Initialized with seed: ${this.seed}`);
    }

    /**
     * Pseudo-random number generator (seeded)
     */
    private random(): number {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    /**
     * Generate SQL Injection payloads
     */
    getSqlInjectionPayloads(): string[] {
        return [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "' UNION SELECT 1, 'admin', 'password' --",
            "admin' --",
            "1; SELECT pg_sleep(5)"
        ];
    }

    /**
     * Generate XSS payloads
     */
    getXssPayloads(): string[] {
        return [
            "<script>alert('xss')</script>",
            "<img src=x onerror=alert(1)>",
            "javascript:alert(1)",
            "\"><script>alert(1)</script>"
        ];
    }

    /**
     * Generate massive strings
     */
    getMassiveString(length: number = 10000): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(this.random() * characters.length));
        }
        return result;
    }

    /**
     * Generate deeply nested JSON
     */
    getDeeplyNestedJson(depth: number = 100): object {
        let current: any = { "end": "here" };
        for (let i = 0; i < depth; i++) {
            current = { "level": i, "nested": current };
        }
        return current;
    }

    /**
     * Generate random valid-looking email
     */
    getRandomEmail(): string {
        return `fuzz_${Math.floor(this.random() * 100000)}@example.com`;
    }

    /**
     * Generate invalid UUIDs
     */
    getInvalidUuids(): string[] {
        return [
            "not-a-uuid",
            "12345",
            "00000000-0000-0000-0000-00000000000Z", // Invalid char
            ""
        ];
    }
}

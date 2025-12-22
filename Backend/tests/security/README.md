# Security Tests

Security tests verify the system is protected against common attacks.

## Purpose
Test security vulnerabilities:
- SQL Injection
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Authentication bypass
- Authorization escalation
- File upload attacks

## Structure
- `injection/` - SQL/NoSQL/Command injection tests
- `authentication/` - Auth bypass, JWT attacks
- `authorization/` - Privilege escalation tests
- `input-validation/` - XSS, file upload, input fuzzing

## Running Tests
```bash
npm run test:security
```

## Example
```typescript
describe('SQL Injection Protection', () => {
    const injectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE users--",
        "admin'--"
    ];

    injectionPayloads.forEach(payload => {
        it(`should reject SQL injection: ${payload}`, async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: payload, password: 'test' });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});
```

## Status
🆕 **NOT YET IMPLEMENTED**  
Target: 80+ attack vectors

## ⚠️ CRITICAL PRIORITY
Security testing is MANDATORY before production deployment.

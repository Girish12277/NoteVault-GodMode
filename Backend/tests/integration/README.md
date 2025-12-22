# Integration Tests

Integration tests verify that different components of the system work together correctly.

## Purpose
Test interactions between:
- HTTP API endpoints with database
- Services with Redis cache
- Message queue integration (Kafka)
- External service integrations (Cloudinary, payment gateways, email)

## Structure
- `api/` - HTTP endpoint integration tests
- `database/` - Database transaction and integrity tests
- `cache/` - Redis caching integration tests  
- `messaging/` - Kafka event publishing/consumption tests
- `external/` - Third-party service integration tests

## Running Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific category
npx jest tests/integration/api
npx jest tests/integration/database
```

## Setup Requirements
- Test database connection
- Redis instance (can use docker)
- Kafka broker (optional, can mock)
- Test API keys for external services

## Test Pattern
Integration tests use real database/cache/services (NOT mocked).
Each test should:
1. Setup test data
2. Execute real API/service calls
3. Verify database state
4. Cleanup test data

## Example
```typescript
import request from 'supertest';
import { app } from '../../../src/app';
import { prisma } from '../../../src/config/database';

describe('Note Creation Integration', () => {
    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should create note and store in database', async () => {
        const response = await request(app)
            .post('/api/notes')
            .set('Authorization', 'Bearer ${validToken}')
            .send({ title: 'Test Note', subject: 'Math' });

        expect(response.status).toBe(201);

        const note = await prisma.note.findUnique({
            where: { id: response.body.data.id }
        });
        expect(note).toBeDefined();
        expect(note.title).toBe('Test Note');
    });
});
```

## Status
🆕 **NOT YET IMPLEMENTED**  
Target: 50+ integration scenarios

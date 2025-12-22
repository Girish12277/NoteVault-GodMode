# Integration Test Setup Guide

## Prerequisites

Integration tests require running infrastructure services.

### Required Services
1. **PostgreSQL** (Test Database) - Port 5433
2. **Redis** (Cache) - Port 6379
3. **Kafka** (Optional, Event Messaging) - Port 9092

---

## Quick Start with Docker Compose

### 1. Start Test Infrastructure
```bash
# Start all test services
docker-compose -f docker-compose.test.yml up -d

# Check services are healthy
docker-compose -f docker-compose.test.yml ps
```

### 2. Setup Test Database
```bash
# Run Prisma migrations on test database
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/studyvault_test" npx prisma migrate deploy

# Optional: Seed test data
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/studyvault_test" npx prisma db seed
```

### 3. Run Integration Tests
```bash
# Set test environment
$env:NODE_ENV='test'
$env:DATABASE_URL='postgresql://testuser:testpass@localhost:5433/studyvault_test'
$env:REDIS_URL='redis://localhost:6379'

# Run tests
npm run test:integration
```

### 4. Stop Test Infrastructure
```bash
# Stop services
docker-compose -f docker-compose.test.yml down

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.test.yml down -v
```

---

## Manual Setup (Without Docker)

### Install Redis Locally
**Windows:**
```powershell
# Using Chocolatey
choco install redis-64

# Start Redis
redis-server
```

**Linux/Mac:**
```bash
brew install redis
redis-server
```

### PostgreSQL Test Database
Create a separate test database:
```sql
CREATE DATABASE studyvault_test;
CREATE USER testuser WITH PASSWORD 'testpass';
GRANT ALL PRIVILEGES ON DATABASE studyvault_test TO testuser;
```

---

## Environment Variables for Tests

Create `.env.test` file:
```env
NODE_ENV=test
DATABASE_URL=postgresql://testuser:testpass@localhost:5433/studyvault_test
REDIS_URL=redis://localhost:6379
KAFKA_BROKER=localhost:9092

# Disable external services
DISABLE_SMTP=true
DISABLE_SMS=true
DISABLE_CLOUDINARY=true
```

---

## Running Tests

### All Integration Tests
```bash
npm run test:integration
```

### Specific Test Suite
```bash
npx jest tests/integration/api/auth.integration.test.ts
```

### With Coverage
```bash
npm run test:integration -- --coverage
```

---

## Troubleshooting

### Redis Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis server
```bash
redis-server
```

### Database Connection Failed
```
Error: Can't reach database server
```
**Solution:** Check PostgreSQL is running on port 5433
```bash
docker-compose -f docker-compose.test.yml ps postgres-test
```

### Port Already in Use
```
Error: bind: address already in use
```
**Solution:** Stop existing service or change port in docker-compose.test.yml

---

## CI/CD Integration

Add to GitHub Actions workflow:
```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: studyvault_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5433/studyvault_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://testuser:testpass@localhost:5433/studyvault_test
          REDIS_URL: redis://localhost:6379
```

---

## Status

**Created:** 2025-12-20  
**Infrastructure:** Docker Compose ready  
**Tests:** Blocked until infrastructure running

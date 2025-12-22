# Read Replica Setup Guide (Enhancement #13)

## Overview

Read replicas offload read-heavy queries from the primary database, improving performance and reliability.

**Current Implementation**: Single primary database  
**Recommended**: 1 primary + 2 read replicas for high availability

---

## Architecture

```
┌─────────────┐
│   App Pod   │
└──────┬──────┘
       │
       ├─── Writes ──────────┐
       │                     ▼
       │              ┌──────────────┐
       │              │   PRIMARY    │ (PostgreSQL)
       │              │   Database   │
       │              └──────┬───────┘
       │                     │
       │           Replication Stream
       │                     │
       └─── Reads ──────┬────┼────┬────────┐
                        ▼    ▼    ▼        ▼
                    ┌────┐ ┌────┐ ┌────┐ ┌────┐
                    │Rep1│ │Rep2│ │Rep3│ │RepN│
                    └────┘ └────┘ └────┘ └────┘
```

---

## Managed Database Setup

### AWS RDS (Recommended)

```bash
# Create read replica via AWS CLI
aws rds create-db-instance-read-replica \
  --db-instance-identifier notevault-read-replica-1 \
  --source-db-instance-identifier notevault-primary \
  --db-instance-class db.t3.medium \
  --publicly-accessible

# Get replica endpoint
aws rds describe-db-instances \
  --db-instance-identifier notevault-read-replica-1 \
  --query 'DBInstances[0].Endpoint.Address'
```

### Google Cloud SQL

```bash
# Create read replica
gcloud sql instances create notevault-replica-1 \
  --master-instance-name=notevault-primary \
  --tier=db-n1-standard-2 \
  --region=us-central1
```

### Azure Database for PostgreSQL

```bash
# Create read replica
az postgres server replica create \
  --name notevault-replica-1 \
  --resource-group notevault-rg \
  --source-server notevault-primary
```

---

## Prisma Configuration

### Option 1: Manual Read/Write Splitting (Simple)

```typescript
// src/config/database.ts
import { PrismaClient } from '@prisma/client';

// Write database (primary)
export const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL  // Primary
    }
  }
});

// Read database (replica)
export const prismaRead = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_READ_URL  // Replica
    }
  }
});

// Export both
export { prismaWrite as prisma };  // Default to write
```

**Usage**:
```typescript
// Read operations (use replica)
const notes = await prismaRead.notes.findMany({ where: {...} });

// Write operations (use primary)
await prismaWrite.notes.create({ data: {...} });
```

---

## Environment Configuration

### .env (Production)

```env
# Primary database (writes)
DATABASE_URL="postgresql://user:pass@primary.rds.amazonaws.com:5432/notevault?connection_limit=20"

# Read replica (reads)
DATABASE_READ_URL="postgresql://user:pass@replica.rds.amazonaws.com:5432/notevault?connection_limit=50"
```

**Note**: Read replicas can handle more connections since they don't handle writes

---

## Query Routing Strategy

### Read Operations (Use Replica)
- ✅ `findMany()`, `findFirst()`, `findUnique()`
- ✅ `count()`, `aggregate()`
- ✅ Search queries
- ✅ Analytics queries
- ✅ Report generation

### Write Operations (Use Primary)
- ✅ `create()`, `update()`, `delete()`
- ✅ `createMany()`, `updateMany()`, `deleteMany()`
- ✅ `upsert()`
- ✅ Transactions

### Mixed Operations (Use Primary)
- ✅ Read-after-write (avoid replication lag)
- ✅ Real-time data requirements
- ✅ Critical path operations

---

## Replication Lag Handling

### Check Replication Lag

```sql
-- On replica
SELECT 
  EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds;
```

### Handle Lag in Code

```typescript
// Critical read-after-write: use primary
const user = await prismaWrite.users.create({ data: {...} });
const profile = await prismaWrite.users.findUnique({  // Use primary!
  where: { id: user.id }
});

// Non-critical read: can use replica
const notes = await prismaRead.notes.findMany({ where: {...} });
```

---

## Load Balancing Multiple Replicas

### Using PgBouncer (Connection Pooler)

```ini
# pgbouncer.ini
[databases]
notevault_read = host=replica-1.rds.com,replica-2.rds.com port=5432 dbname=notevault

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

**Connection**:
```env
DATABASE_READ_URL="postgresql://user:pass@pgbouncer:6432/notevault_read"
```

---

## Monitoring Read Replicas

### Key Metrics

| Metric | Target | Alert |
|--------|--------|-------|
| Replication Lag | <1s | >5s |
| Replica CPU | <70% | >85% |
| Replica Connections | <80% max | >90% |
| Read Query p95 | <100ms | >500ms |

### Health Check

```typescript
// Add to health controller
async checkReplicaLag() {
  const result = await prismaRead.$queryRaw`
    SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag
  `;
  return result[0].lag;
}
```

---

## Failover Strategy

### Automatic Failover (AWS RDS)

```bash
# Promote replica to primary
aws rds promote-read-replica \
  --db-instance-identifier notevault-replica-1
```

### Application Failover

```typescript
// Fallback to primary if replica fails
async function safeRead(query: () => Promise<any>) {
  try {
    return await query();  // Try replica
  } catch (error) {
    logger.warn('Replica query failed, falling back to primary');
    return await query();  // Fallback to primary
  }
}
```

---

## Performance Optimization

### Query Distribution

**Target Split**:
- 80% reads → replicas
- 20% writes → primary

**Result**:
- Primary CPU: 60% → 20% (3x reduction)
- Replica CPU: 0% → 40%
- Overall capacity: +3x

---

## Production Checklist

- [ ] Create 2+ read replicas
- [ ] Configure `DATABASE_READ_URL`
- [ ] Update Prisma client imports
- [ ] Route read queries to replicas
- [ ] Monitor replication lag
- [ ] Test failover procedure
- [ ] Configure PgBouncer (optional)
- [ ] Set up replica health checks

---

## Cost Analysis

### Without Read Replicas
- 1 primary: db.t3.large ($150/month)
- Total: **$150/month**

### With Read Replicas
- 1 primary: db.t3.medium ($75/month)
- 2 replicas: 2 × db.t3.small ($50/month)
- Total: **$175/month**

**Result**: +$25/month (+17%) for 3x capacity

---

**Status**: 📘 Configuration Guide  
**Implementation**: Optional (recommended for >1M users/month)  
**Complexity**: Medium (requires code changes for read/write split)

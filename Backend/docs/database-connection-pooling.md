# Database Connection Pooling Configuration (Enhancement #12)

## Prisma Connection Pool Settings

The database connection pool is configured in your Prisma schema and can be fine-tuned via the `DATABASE_URL` connection string.

### Current Configuration

**File**: `prisma/schema.prisma`
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Recommended Production Settings

**Environment Variable**: `.env`

```env
# Production Database URL with Connection Pool Settings
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public&connection_limit=20&pool_timeout=20&connect_timeout=10"
```

### Connection Pool Parameters

| Parameter | Recommended | Description |
|-----------|-------------|-------------|
| `connection_limit` | 20-50 | Max connections per instance (adjust based on load) |
| `pool_timeout` | 20 | Seconds to wait for connection from pool |
| `connect_timeout` | 10 | Seconds to wait for new connection |

### Prisma Client Configuration

**File**: `src/config/database.ts`

Add connection pool logging and optimization:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
  
  // Connection pool configuration (from environment)
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export { prisma };
```

### Auto-Scaling Formula

**Connection Pool Sizing**:
```
Total Connections = (Number of App Instances) × (Connections per Instance)
Recommended: Keep total < 80% of database max_connections
```

**Example**:
- Database: 100 max_connections
- Target: 80 connections max
- 4 app instances → 20 connections each

### Monitoring Connection Pool

Check active connections:
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'your_database';
```

### Production Checklist

- [ ] Set `connection_limit` in DATABASE_URL
- [ ] Monitor connection pool usage via `/metrics` endpoint
- [ ] Set database `max_connections` appropriately
- [ ] Configure connection pool per environment
- [ ] Test connection pool exhaustion scenarios

### Connection Pool Best Practices

1. **Right-size connections**: Start with 20, increase based on load
2. **Monitor pool usage**: Track active vs idle connections
3. **Set timeouts**: Prevent hanging connections
4. **Use read replicas**: Offload read queries (Enhancement #13)
5. **Connection pooling**: Use PgBouncer for additional pooling layer

### Prisma Connection Pool Events

Prisma automatically manages:
- ✅ Connection reuse
- ✅ Idle connection cleanup
- ✅ Connection health checks
- ✅ Automatic reconnection
- ✅ Query queueing when pool full

### Troubleshooting

**Issue**: "Too many connections"
- **Solution**: Reduce `connection_limit` or increase database `max_connections`

**Issue**: "Connection timeout"
- **Solution**: Increase `pool_timeout` or `connect_timeout`

**Issue**: Slow queries blocking pool
- **Solution**: Add query timeout, optimize slow queries

---

**Status**: ✅ Connection pooling configured via DATABASE_URL  
**Next**: Monitor pool usage in production via `/metrics/json`

# Database Backup & Recovery - Environment Variables

## Required Environment Variables

Add these to your `.env` file:

```bash
# AWS S3 Configuration for Backups (GOD-LEVEL FIX #2)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
BACKUP_S3_BUCKET=notevault-backups

# Backup Configuration (Optional - defaults shown)
BACKUP_DIR=./backups                # Local backup directory
BACKUP_RETENTION_DAYS=30            # How long to keep backups in S3
```

## AWS S3 Bucket Setup

### 1. Create S3 Bucket
```bash
aws s3 mb s3://notevault-backups --region ap-south-1
```

### 2. Enable Encryption
```bash
aws s3api put-bucket-encryption \
  --bucket notevault-backups \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 3. Enable Versioning (Optional but Recommended)
```bash
aws s3api put-bucket-versioning \
  --bucket notevault-backups \
  --versioning-configuration Status=Enabled
```

### 4. Set Lifecycle Policy (Auto-delete old backups)
```bash
aws s3api put-bucket-lifecycle-configuration \
  --bucket notevault-backups \
  --lifecycle-configuration file://backup-lifecycle.json
```

**backup-lifecycle.json**:
```json
{
  "Rules": [{
    "Id": "Delete old backups",
    "Status": "Enabled",
    "Prefix": "daily/",
    "Expiration": {
      "Days": 30
    }
  }]
}
```

## PostgreSQL Configuration (Windows)

### 1. Ensure pg_dump is in PATH

```powershell
# Find PostgreSQL bin directory
$pgPath = "C:\Program Files\PostgreSQL\15\bin"  # Adjust version

# Add to PATH (temporary)
$env:PATH += ";$pgPath"

# Add to PATH (permanent)
[Environment]::SetEnvironmentVariable(
    "PATH", 
    $env:PATH + ";$pgPath", 
    [EnvironmentVariableTarget]::Machine
)
```

### 2. Verify pg_dump works
```powershell
pg_dump --version
```

## Backup Schedule (Automated)

**Cron Schedule** (runs automatically):
- **Daily Full Backup**: 3 AM IST (after financial reconciliation)
- **Retention**: 30 days in S3
- **Verification**: Automatic (gzip -t)
- **Alerts**: Ops team notified on failure

## Manual Backup Commands

### Create Manual Backup
```typescript
import { DatabaseBackupService } from './services/databaseBackupService';

// Initialize service
await DatabaseBackupService.initialize();

// Create backup
const result = await DatabaseBackupService.createFullBackup();

console.log(result);
// Output: { success: true, backupFile: 'notevault_backup_...sql.gz', sizeBytes: 12345678, s3Key: 'daily/...' }
```

### Restore from Backup
```typescript
// List available backups
const stats = await DatabaseBackupService.getBackupStats();
console.log(stats);

// Restore from specific backup
const restored = await DatabaseBackupService.restoreFromBackup('daily/notevault_backup_2025-12-18.sql.gz');
```

## Disaster Recovery Procedures

### Scenario 1: Hardware Failure

```bash
# 1. Provision new server
# 2. Install PostgreSQL
# 3. Configure environment variables
# 4. Restore from latest backup

npm run restore:latest
```

### Scenario 2: Accidental DELETE

```bash
# Point-in-time recovery to before deletion
# Example: Restore to 2 PM today

npm run restore:pitr -- "2025-12-18 14:00:00"
```

### Scenario 3: Ransomware Attack

```bash
# 1. Isolate infected system
# 2. Provision clean server
# 3. Restore from backup (before infection)
# 4. Change all passwords

npm run restore:date -- "2025-12-17"  # Day before attack
```

## Recovery Metrics

**Recovery Time Objective (RTO)**: < 30 minutes  
**Recovery Point Objective (RPO)**: < 1 hour (hourly WAL archiving planned)

##Cost Estimation (Monthly)

**S3 Storage**:
- Database size: ~500MB
- Backups kept: 30 days
- Storage: 500MB × 30 = 15GB
- Cost: 15GB × $0.023/GB = **$0.35/month**

**S3 Requests**:
- Daily uploads: 1
- Monthly: 30 uploads
- Cost: 30 × $0.005 = **$0.15/month**

**Total**: **~$0.50/month** (negligible cost for disaster recovery)

## Security Best Practices

1. **Separate AWS Account**: Use different AWS account for backups (ransomware protection)
2. **IAM Permissions**: Least privilege (write-only for backups, read for restores)
3. **Encryption**: Server-side encryption (AES256) enabled
4. **Access Logging**: Enable S3 access logs
5. **MFA Delete**: Enable MFA for bucket deletion

## Monitoring

**Backup Success Rate**: Should be 100%  
**Alert Channels**: #ops-alerts (Slack)  
**Metrics**: Available via `/metrics` endpoint

```json
{
  "backup": {
    "lastBackupTime": "2025-12-18T03:00:00Z",
    "lastBackupSize": 524288000,
    "backupCount": 30,
    "totalSizeMB": 15360
  }
}
```

## Troubleshooting

### Error: "pg_dump: command not found"

**Solution**: Add PostgreSQL bin to PATH (see PostgreSQL Configuration)

### Error: "Access Denied" on S3 upload

**Solution**: Check AWS credentials and IAM permissions

### Error: "Database connection failed"

**Solution**: Verify DATABASE_URL is correct

## Testing Backup & Restore

```bash
# Run backup test
npm run test:backup

# Expected output:
# ✅ Backup created: notevault_backup_test.sql.gz
# ✅ Backup verified (gzip -t passed)
# ✅ Uploaded to S3: daily/notevault_backup_test.sql.gz
# ✅ Restore test passed
```

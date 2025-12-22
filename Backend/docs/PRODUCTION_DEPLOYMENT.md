# 🚀 God-Tier Production Deployment Guide (Enhancement #16)

## Overview

This guide provides step-by-step instructions for deploying the NoteVault API to production with all 16 God-Tier enhancements enabled.

**Target**: Zero-downtime, auto-scaling, 10M users/month capable deployment

---

## Prerequisites

- [ ] Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- [ ] PostgreSQL database (managed or self-hosted)
- [ ] Container registry (Docker Hub, GCR, ECR)
- [ ] Domain name with DNS access
- [ ] SSL certificate (Let's Encrypt or commercial)
- [ ] Razorpay account (production credentials)
- [ ] Cloudinary account (production credentials)

---

## Phase 1: Pre-Deployment Setup

### 1.1 Database Setup

```bash
# Create production database
createdb notevault_production

# Run Prisma migrations
cd Backend
DATABASE_URL="postgresql://user:pass@host:5432/notevault_production" npx prisma migrate deploy

# Verify migration
npx prisma db push --skip-generate
```

### 1.2 Environment Configuration

Create production `.env`:

```env
# Application
NODE_ENV=production
PORT=5001
LOG_LEVEL=info

# Database (with connection pooling)
DATABASE_URL="postgresql://user:pass@host:5432/notevault?schema=public&connection_limit=20&pool_timeout=20&connect_timeout=10"

# JWT
JWT_SECRET=<generate-with-openssl-rand-hex-64>
JWT_EXPIRES_IN=7d

# Razorpay (PRODUCTION KEYS)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Cloudinary (PRODUCTION)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Security
SECURITY_WEBHOOK_URL=https://your-slack-webhook-or-pagerduty.com
FRONTEND_URL=https://notevault.com
```

**CRITICAL**: Never commit `.env` to version control!

### 1.3 Build & Push Docker Image

```bash
# Build production image
docker build -t your-registry/notevault-api:v1.0.0 .

# Tag as latest
docker tag your-registry/notevault-api:v1.0.0 your-registry/notevault-api:latest

# Push to registry
docker push your-registry/notevault-api:v1.0.0
docker push your-registry/notevault-api:latest
```

---

## Phase 2: Kubernetes Deployment

### 2.1 Create Kubernetes Secrets

```bash
# Create secrets from .env file
kubectl create secret generic notevault-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=jwt-secret="..." \
  --from-literal=razorpay-key-id="..." \
  --from-literal=razorpay-key-secret="..." \
  --from-literal=razorpay-webhook-secret="..." \
  --from-literal=cloudinary-cloud-name="..." \
  --from-literal=cloudinary-api-key="..." \
  --from-literal=cloudinary-api-secret="..."

# Create config map
kubectl create configmap notevault-config \
  --from-literal=security-webhook-url="https://..." \
  --from-literal=frontend-url="https://notevault.com"
```

### 2.2 Deploy Application

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/secrets.yaml

# Verify deployment
kubectl get pods -l app=notevault-api
kubectl get svc notevault-api-service
kubectl get hpa notevault-api-hpa
```

### 2.3 Verify Health

```bash
# Get external IP
kubectl get svc notevault-api-service

# Test health endpoint
curl http://<EXTERNAL-IP>/health/detailed

# Expected output:
# {"status":"healthy","timestamp":"...","uptime":...}
```

---

## Phase 3: Post-Deployment Verification

### 3.1 Smoke Tests

```bash
# Health check
curl https://api.notevault.com/health/detailed | jq .

# Metrics
curl https://api.notevault.com/metrics/json | jq .

# Liveness probe
curl https://api.notevault.com/health/live

# Readiness probe
curl https://api.notevault.com/health/ready
```

### 3.2 Load Testing

```bash
# Install k6
brew install k6  # macOS
# OR
sudo apt install k6  # Ubuntu

# Run load test
cd tests/load
BASE_URL=https://api.notevault.com k6 run api-load-test.js

# Expected:
# ✓ 95% requests < 2s
# ✓ Error rate < 1%
```

### 3.3 Monitoring Setup

**Prometheus Scraping** (if using Prometheus):
```yaml
scrape_configs:
  - job_name: 'notevault-api'
    static_configs:
      - targets: ['api.notevault.com:80']
    metrics_path: '/metrics'
    scrape_interval: 30s
```

**Grafana Dashboard**:
- Import dashboard ID: (create custom from `/metrics/json`)
- Key metrics:
  - Request rate
  - Error rate
  - p95 latency
  - Active connections
  - Memory usage
  - Alert DLQ failures

---

## Phase 4: Production Hardening

### 4.1 Enable All God-Tier Features

✅ **Enhancements 1-5 (Critical)**:
- [x] Timestamp validation (replay attack prevention)
- [x] Real-time security alerts
- [x] Atomic database transactions
- [x] Circuit breakers on Razorpay
- [x] Server-side webhook handler

✅ **Enhancements 6-8 (Hardening)**:
- [x] Alert DLQ with retry logic
- [x] Health check endpoints
- [x] Graceful shutdown (SIGTERM)

✅ **Enhancements 9-11 (Observability)**:
- [x] Structured logging (Winston)
- [x] Correlation IDs
- [x] Prometheus metrics

✅ **Enhancements 12-16 (Infrastructure)**:
- [x] Database connection pooling
- [x] Kubernetes auto-scaling (HPA)
- [x] Load testing (k6)
- [x] Production deployment guide

### 4.2 Configure Auto-Scaling

```bash
# Verify HPA is active
kubectl get hpa notevault-api-hpa

# Expected output:
# NAME                  REFERENCE              TARGETS   MINPODS   MAXPODS   REPLICAS
# notevault-api-hpa    Deployment/notevault   30%/70%   3         10        3
```

**HPA will automatically scale based on**:
- CPU utilization > 70% → scale up
- Memory utilization > 80% → scale up
- Low load → scale down (min 3 pods)

### 4.3 Set Up Alerting

Configure alerts for:
- 🔴 Circuit breaker OPEN (Razorpay down)
- 🔴 Alert DLQ failures > 10
- 🟡 Error rate > 1%
- 🟡 p95 latency > 2s
- 🟡 Pod restarts > 3/hour
- 🟡 Memory usage > 90%

---

## Phase 5: Operational Procedures

### 5.1 Rolling Updates

```bash
# Update image
kubectl set image deployment/notevault-api api=your-registry/notevault-api:v1.0.1

# Monitor rollout
kubectl rollout status deployment/notevault-api

# Rollback if needed
kubectl rollout undo deployment/notevault-api
```

### 5.2 Database Migrations

```bash
# Zero-downtime migration process:
# 1. Deploy code that works with OLD and NEW schema
# 2. Run migration
# 3. Deploy code that only uses NEW schema

# Run migration
kubectl exec -it <pod-name> -- npx prisma migrate deploy
```

### 5.3 Scaling Operations

```bash
# Manual scale (override HPA temporarily)
kubectl scale deployment notevault-api --replicas=5

# Re-enable HPA
kubectl autoscale deployment notevault-api --min=3 --max=10 --cpu-percent=70
```

### 5.4 Log Access

```bash
# View logs
kubectl logs -f deployment/notevault-api

# Filter by correlation ID
kubectl logs deployment/notevault-api | grep "req_1234567890"

# Access  log files (if mounted volume)
kubectl exec -it <pod-name> -- tail -f /app/logs/combined.log
```

---

## Phase 6: Disaster Recovery

### 6.1 Database Backup

```bash
# Automated daily backups
pg_dump notevault_production | gzip > backup-$(date +%Y%m%d).sql.gz

# Upload to S3/GCS
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://notevault-backups/
```

### 6.2 Restore Procedure

```bash
# Stop application
kubectl scale deployment notevault-api --replicas=0

# Restore database
gunzip < backup-20250118.sql.gz | psql notevault_production

# Restart application
kubectl scale deployment notevault-api --replicas=3
```

### 6.3 Circuit Breaker Recovery

If Razorpay circuit breaker opens:
1. Check Razorpay status page
2. Monitor `/metrics/json` for circuit state
3. Circuit auto-recovers after 30s if Razorpay is back
4. Manual circuit control: (not implemented, add if needed)

---

## Production Checklist

### Pre-Go-Live
- [ ] All migrations applied
- [ ] Production secrets configured
- [ ] SSL certificate installed
- [ ] DNS records pointing to LoadBalancer
- [ ] Load test passed (p95 < 2s, errors < 1%)
- [ ] Health endpoints responding
- [ ] Monitoring/alerting configured
- [ ] Backup strategy implemented
- [ ] Rollback procedure tested
- [ ] Team trained on operations

### Post-Go-Live Monitoring (First 24h)
- [ ] Monitor error rates (target: <0.5%)
- [ ] Monitor p95 latency (target: <1s under normal load)
- [ ] Verify HPA scaling behavior
- [ ] Check alert DLQ (should be empty)
- [ ] Verify webhook processing
- [ ] Monitor database connections
- [ ] Check memory/CPU usage trends

---

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| p95 Latency | <1s | >2s |
| Error Rate | <0.1% | >1% |
| Uptime | 99.9% | <99.5% |
| Request Rate | 50 req/sec (peak) | N/A |
| Database Connections | <80/100 max | >90 |
| Memory Usage (per pod) | <400MB | >480MB |
| CPU Usage | <60% | >80% |

---

## Support & Maintenance

**Regular Tasks**:
- Weekly: Review error logs, DLQ, circuit breaker events
- Monthly: Database performance tuning, index optimization
- Quarterly: Load test, security audit, dependency updates

**Emergency Contacts**:
- DevOps Team: ops@notevault.com
- Database Admin: dba@notevault.com
- Security Team: security@notevault.com

---

## Appendix: Troubleshooting

### Issue: High Database Connection Count
**Solution**: Reduce `connection_limit` in DATABASE_URL

### Issue: Pod OOMKilled
**Solution**: Increase memory limits in `k8s/deployment.yaml`

### Issue: HPA not scaling
**Solution**: Verify metrics-server is installed (`kubectl get apiservice v1beta1.metrics.k8s.io`)

### Issue: Circuit breaker stuck OPEN
**Solution**: Check Razorpay status, review logs with correlation ID

### Issue: Graceful shutdown timeout
**Solution**: Increase terminationGracePeriodSeconds in deployment manifest

---

**Deployment Guide Version**: 1.0.0  
**Last Updated**: 2025-12-18  
**Status**: ✅ Production-Ready

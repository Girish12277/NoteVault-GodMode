# Performance Testing Guide (Cloud Edition)

To bypass local hardware limitations, use **k6 Cloud** (Grafana) for Peak (1000 VU) and Stress (5000 VU) tests.

## ⚠️ Critical Prerequisite: Public URL
Cloud load generators **cannot** access `localhost`. You must expose your local server or deploy it.
1. **Option A (Recommended):** Use [ngrok](https://ngrok.com/) to tunnel localhost.
   ```bash
   ngrok http 5001
   # Use the generated URL (e.g., https://abc.ngrok-free.app) as API_URL
   ```
2. **Option B:** Deploy to Staging/Production.

## Authentication
1. Log in to your Grafana/k6 account:
   ```bash
   k6 login cloud
   ```

## Running Tests in Cloud

### 1. Peak Load (1000 VU)
```bash
k6 cloud tests/performance/load/peak.js -e API_URL=https://your-ngrok-url.app/api
```

### 2. Stress Test (5000 VU)
```bash
k6 cloud tests/performance/load/stress.js -e API_URL=https://your-ngrok-url.app/api
```

### 3. Baseline (100 VU) - Local Safe
You can still run this locally if preferred, or in cloud:
```bash
k6 run tests/performance/load/baseline.js
# OR
k6 cloud tests/performance/load/baseline.js -e API_URL=https://...
```

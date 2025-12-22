# Performance Tests

Performance tests verify system scalability and identify bottlenecks.

## Purpose
Measure:
- Response time under load
- System breaking points
- Database query performance
- Memory/CPU usage

## Structure
- `load/` - Expected load scenarios (100-1000 VU)
- `stress/` - Breaking point tests (5000+ VU)
- `endurance/` - Sustained load over time

## Tool
**k6** (recommended) or Artillery

## Setup
```bash
# Install k6
# Windows: choco install k6
# Mac: brew install k6
# Linux: sudo apt install k6
```

## Running Tests
```bash
k6 run tests/performance/load/baseline.js
```

## Example
```javascript
// baseline.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        http_req_duration: ['p(99)<1000'],
    },
};

export default function () {
    let response = http.get('http://localhost:3000/api/notes');
    check(response, {
        'status is 200': (r) => r.status === 200,
    });
    sleep(1);
}
```

## Status
🆕 **NOT YET IMPLEMENTED**  
Target: 1000 VU @ <500ms p99

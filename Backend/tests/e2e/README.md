# End-to-End Tests

E2E tests verify complete user workflows from browser automation.

## Purpose
Test real user journeys:
- User registration → purchase → download
- Seller upload → approval → payout
- Admin moderation → refunds

## Structure
- `user-journeys/` - Buyer/Seller workflows  
- `admin-workflows/` - Admin panel operations
- `error-scenarios/` - Error recovery flows

## Tool
**Playwright** (recommended) or Cypress

## Setup
```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running Tests
```bash
npm run test:e2e
```

## Example
```typescript
import { test, expect } from '@playwright/test';

test('User can purchase note', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');

    await page.goto('/notes/123');
    await page.click('button:has-text("Buy Now")');
    
    await expect(page).toHaveURL('/purchase/success');
});
```

## Status
🆕 **NOT YET IMPLEMENTED**  
Target: 15+ user journeys

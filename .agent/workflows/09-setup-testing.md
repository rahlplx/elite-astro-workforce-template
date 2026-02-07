---
description: Automated setup for Playwright E2E testing in Astro 6 projects
---

# Workflow: Setup Playwright Testing

This workflow automates the installation and configuration of Playwright for end-to-end testing, tailored for the Elite Workforce project.

## 1. Prerequisites

- Node.js 22+
- Astro 6 project structure

## 2. Automated Installation

Run the following command to install Playwright and its dependencies:

```bash
# turbo
npm init playwright@latest -- --yes --quiet --browser=chromium --browser=firefox --browser=webkit --gha
```

## 3. Configuration Generation

The agent will generate a `playwright.config.ts` optimized for Astro:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321', // Astro default port
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 4. Example Medical Pattern (`tests/e2e/booking.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Elite Workforce/);
});

test('patient booking flow', async ({ page }) => {
  await page.goto('/booking');
  await page.getByLabel('Name').fill('John Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByRole('button', { name: 'Book Appointment' }).click();
  await expect(page.getByText('Success')).toBeVisible();
});
```

## 5. Verification

1. Run `npx playwright test`.
2. Verify results in `playwright-report/index.html`.
3. Check visual regressions with `/check-visual`.

---
**Version**: 1.0.0
**Maintained By**: WebApp Testing Specialist

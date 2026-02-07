# Development Guardrails Workflow

> **Command:** `/check-build`
> **Purpose:** Validate build integrity, accessibility, and visual consistency before deployment.

---

## Workflow Definition

### Trigger
Run `/check-build` before:
- Creating a pull request
- Merging to main branch
- Deploying to production
- After significant CSS/layout changes

### Pipeline Stages

```
┌─────────────────┐
│  1. Type Check  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. JIT Verify  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. A11y Audit  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Visual Diff │
└─────────────────┘
```

---

## Stage 1: Type Check

### Command
```bash
npx astro check
```

### Success Criteria
- Exit code: 0
- Zero TypeScript errors
- Zero Astro template errors

### Failure Actions
| Error Type | Resolution |
|------------|------------|
| Missing types | Add to `src/types/` or component interface |
| Import errors | Verify path aliases in `tsconfig.json` |
| Schema mismatch | Update Zod schema in `src/content.config.ts` |

---

## Stage 2: JIT Verify (Tailwind 4 Compilation)

### Command
```bash
npm run build
```

### Success Criteria
- Exit code: 0
- No CSS compilation warnings
- `dist/` directory generated
- All `@theme` tokens resolved

### Tailwind 4 Specific Checks
Verify in build output:
- [ ] No "Unknown at-rule" warnings for `@theme`
- [ ] No "Unknown at-rule" warnings for `@layer`
- [ ] CSS output uses OKLCH color values
- [ ] No fallback to Tailwind 3 patterns

### Failure Actions
| Error Type | Resolution |
|------------|------------|
| `@theme` not recognized | Verify `@tailwindcss/vite` in `astro.config.mjs` |
| Missing utility classes | Check `src/styles/global.css` imports |
| Build timeout | Check for circular imports |

---

## Stage 3: Accessibility Audit

### Tool
axe-core via Browser Agent or Playwright

### Command (Playwright Example)
```bash
npx playwright test --project=a11y
```

### Test Configuration
```typescript
// tests/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = ['/', '/services', '/blog', '/appointments/book'];

for (const page of pages) {
  test(`a11y: ${page}`, async ({ page: browserPage }) => {
    await browserPage.goto(page);
    const results = await new AxeBuilder({ page: browserPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
```

### Success Criteria
| Metric | Threshold | Status |
|--------|-----------|--------|
| Axe score | ≥ 95 | REQUIRED |
| Critical violations | 0 | REQUIRED |
| Serious violations | 0 | REQUIRED |
| Moderate violations | ≤ 3 | WARNING |

### Failure Actions (Score < 95)
1. **HALT** — Do not proceed to deployment
2. Review `axe-results.json` for violation details
3. Fix violations in priority order:
   - Critical → Serious → Moderate → Minor
4. Re-run `/check-build`

### Common Violations & Fixes

| Violation | Fix |
|-----------|-----|
| Missing alt text | Add `alt=""` for decorative, descriptive for informative |
| Low contrast | Use OKLCH colors meeting 4.5:1 ratio |
| Missing labels | Add `<label for="">` or `aria-label` |
| Missing landmarks | Wrap in `<main>`, `<nav>`, `<header>`, `<footer>` |
| Focus not visible | Add `:focus-visible` styles |

---

## Stage 4: Visual Diff

### Trigger Conditions
Run visual diff when:
- `src/styles/global.css` modified
- Any `@theme` token changed
- Layout components modified
- New pages added

### Tool
Browser Agent screenshot comparison or Percy/Chromatic

### Baseline Pages
```
/                       # Homepage
/services               # Services listing
/blog                   # Blog index
/appointments/book      # Booking form
```

### Workflow
1. Capture current screenshots
2. Compare against baseline (main branch)
3. Generate diff report

### Success Criteria
| Metric | Threshold | Status |
|--------|-----------|--------|
| Pixel diff | < 0.1% | AUTO-PASS |
| Pixel diff | 0.1% - 5% | REVIEW REQUIRED |
| Pixel diff | > 5% | MANUAL APPROVAL |

### Failure Actions
1. Review diff highlights in visual report
2. Determine if changes are intentional:
   - **Intentional:** Update baseline, approve
   - **Unintentional:** Fix CSS, re-run
3. Document visual changes in commit message

---

## Workflow Execution Script

### npm Script Addition
```json
{
  "scripts": {
    "check": "npm run check:types && npm run check:build && npm run check:a11y",
    "check:types": "astro check",
    "check:build": "astro build",
    "check:a11y": "playwright test --project=a11y"
  }
}
```

### Full Workflow Command
```bash
npm run check
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Check Build

on:
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - run: npm ci

      - name: Type Check
        run: npx astro check

      - name: Build
        run: npm run build

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: A11y Audit
        run: npx playwright test --project=a11y

      - name: Upload Results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
```

---

## Failure Escalation

### Automatic Blocks
The following failures **block deployment**:

| Stage | Condition | Block Level |
|-------|-----------|-------------|
| Type Check | Any error | HARD BLOCK |
| Build | Exit code ≠ 0 | HARD BLOCK |
| A11y | Score < 95 | HARD BLOCK |
| A11y | Critical violation | HARD BLOCK |
| Visual | Diff > 5% (unapproved) | SOFT BLOCK |

### Override Protocol
To override a soft block:
1. Document reason in PR description
2. Obtain approval from project lead
3. Add `[visual-override]` tag to commit

**Hard blocks cannot be overridden.**

---

## Quick Reference

```bash
# Full check
npm run check

# Individual stages
npx astro check           # Types
npm run build             # JIT/Build
npx playwright test       # A11y

# Visual diff (manual)
npx playwright test --project=visual --update-snapshots  # Update baseline
npx playwright test --project=visual                      # Compare
```

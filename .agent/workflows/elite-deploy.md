---
description: Elite production deployment and verification cycle
---

# /elite-deploy Workflow

This command automates the highest tier of verification for the Elite Workforce healthcare platform.

## Steps

// turbo-all

### 1. Static Integrity Check

```powershell
cd smile-savers-site
npx astro check
```

### 2. Accessibility Scan (WCAG 2.1 AA)

```powershell
npx pa11y http://localhost:4321
```

### 3. Performance Stress Test (98+ Goal)

```powershell
npx lighthouse http://localhost:4321 --chrome-flags="--headless"
```

### 4. Build & Compaction

```powershell
npm run build
```

---
**Elite Tier Alert**: This workflow must be green before any release candidate is finalized.

---
description: Automated dev cycle for 2026 stack verification
---

# /check-build Workflow

This workflow ensures your code is type-safe and your Tailwind 4 styles are compiling correctly.

## Steps

// turbo-all

### 1. Verification Run

```powershell
cd smile-savers-site
npx astro check
```

### 2. Build Check (JIT Verification)

```powershell
npm run build
```

### 3. Visual Audit

```powershell
# Open the Antigravity Browser Agent
# Navigate to the preview URL
```

---
**Status**: Run this after any major feature change to maintain premium UI/UX standards.

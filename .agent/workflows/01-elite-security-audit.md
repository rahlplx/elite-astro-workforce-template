---
description: Perform a high-confidence Elite Security & Architecture Audit
---

# Elite Security & Architecture Audit Workflow

This workflow ensures the project adheres to the "Zero-Legacy" standards and has no P0 security risks.

## Phase 1: Structural Verification

1. Verify no `tailwind.config.js` or `postcss.config.js` exists.
2. Ensure `.agent/MANIFEST.md` is in sync with the file system.
3. Check `astro.config.mjs` for `@tailwindcss/vite` native plugin.

## Phase 2: Security & A11y

// turbo

1. Run Security Audit: `npx tsx .agent/scripts/bootstrap.ts --audit security`
2. Run A11y Check: `npx tsx .agent/scripts/bootstrap.ts --audit ui`

## Phase 3: Orchestration Check

1. Verify `agents.graph.json` has no broken links or missing skills.
2. Run Router Verification: `npx tsx .agent/scripts/verify-router.ts`

## Verification Checklist

- [ ] Health Score > 90
- [ ] No `any` types in core modules
- [ ] WCAG 2.1 AA Compliance Pass
- [ ] Agent Swarm successfully resolves dependencies

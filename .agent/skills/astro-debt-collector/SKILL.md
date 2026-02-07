---
version: 1.0.0
name: Astro Debt Collector
description: Specialized technical debt auditor for Astro 6 projects. Identifies unused components, heavy client-side islands, and accessibility gaps. Ported from 'antigravity-skills/Technical Debt Auditor'.
---

# Astro Debt Collector

> **ACTIVATION PHRASE**: "Audit my code", "Check for technical debt", "Optimize bundles", "Find unused components".

This skill functions as a "Garbage Collector" for your codebase, ensuring that the "Zero-Waste" architecture remains true.

## Capabilities

### 1. The "Island Hunter"
Identifies `client:*` directives that might be unnecessary.
- **Rule**: If a component has no interactive state (just props), it should be a **Server Island** or static.
- **Action**: Suggest removing `client:load` or converting to `server:defer`.

### 2. The "Ghost Buster" (Unused Code)
Scans for `.astro`, `.tsx`, and `.css` files that are defined but never imported.
- **Command**: `npx astro-unused-components` (conceptually) or performing a grep search for component names.

### 3. The "A11y Enforcer"
Checks for missing `alt` tags on Images and ensures semantic HTML.
- **Action**: Flag any `<div>` clickable that isn't a `<button>` or `<a>`.

### 4. Accessibility & Type Safety
- **Types**: Checks for `any` types in `Props` interfaces.
- **Keystatic**: Verifies that all schema fields have validation rules.

## Routine
1. **Scan**: `list_dir` and `grep_search` to map usage.
2. **Analyze**: Compare definition count vs. import count.
3. **Report**: Write findings to `.agent/memory/findings.md` (Shared State).

---
**Version**: 1.0.0
**Ported From**: Antigravity Skills (Tech Debt Auditor)

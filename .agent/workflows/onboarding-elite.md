---
description: Onboarding and absorption of an existing Astro project (70% done)
---

# 🚀 Elite Project Onboarding & Absorption

Use this workflow when integrating the Elite Workforce system into an existing Astro project that is partially complete (e.g., 70% done).

## Phase 1: Deep Discovery (Deep Search & Mapping)

Execute this command to trigger the auto-analysis:

```text
/onboard-absorption [project-context]
```

### What happens automatically:

1. **Symbolic Plan Generation (ReWoo)**: The system creates a parallel execution graph to map the existing codebase.
2. **Architecture Audit**:
    - Identifies Astro versions, adapters, and middleware.
    - Maps the existing Component hierarchy.
    - Audits `package.json` for security and performance gaps.
3. **Design System Extraction**:
    - Searches for CSS variables, Tailwind configs, or hardcoded hex codes.
    - Generates a baseline `ATLAS_TOKENS.md` if missing.

## Phase 2: Technical Debt & Learning

The system extracts "Lessons" from the 70% of work already done:

1. **Failure Mode Detection**: Scans Git history and current code for common patterns (e.g., hydration issues, heavy client islands).
2. **Success Pattern Capture**: Identifies well-implemented modules to use as templates for future work.
3. **Reflexion Memory**: Updates `.agent/memory/lessons.md` with project-specific nuances.

## Phase 3: Elite Alignment

1. **Auto-Triggered Hardening**:
    - Runs `vulnerability-scanner` on existing dependencies.
    - Runs `sentinel-auditor` on current UI components.
2. **Protocol Sync**:
    - Injects `ELITE_PROTOCOL.md` into the developer context.
    - Sets up `Lefthook` or pre-commit checks for automated quality gates.

## Phase 4: Tailored Workflow Generation

The agent generates a `PROJECT_ONBOARDING_WALKTHROUGH.md` containing:

- Current project health score.
- High-confidence roadmap for the remaining 30%.
- Custom slash commands for unique project patterns.

## Recommended Activation

To start, simply say:
"Run /onboard-absorption and analyze the current project state to build a high-confidence implementation roadmap."

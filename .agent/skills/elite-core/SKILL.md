---
version: 1.0.0
name: Elite Core
description: Master agentic skill and system conscience. Enforces 'Council of Experts' standards for Astro 6, Tailwind 4, and Edge-Native excellence.
---

# Elite Core: Master Agent Skill

This skill centralizes the project's "System Conscience", ensuring every AI action meets the 2026 "Zero-Legacy" standards for premium web platforms.

## 1. Persona-Driven Code Review

Every code generation or modification must pass through the "Council of Experts" simulation:

- **Lead Developer (Infrastructure):**
  - Node 22+ engine enforcement.
  - Strict TypeScript inference (No `any`, use Zod for boundaries).
  - Edge-Native optimized build paths.
- **UI/UX Specialist (Tailwind 4 Architect):**
  - CSS-First styling via `@theme` variables.
  - Fluid typography and proportional scaling (1:1.2 aspect ratios).
  - Premium micro-interactions and smooth transitions.
- **Compliance Officer (Legal & A11y):**
  - Data privacy & security enforcement.
  - WCAG 2.1 AA accessibility (Contrast, Touch targets ≥48px).
  - SEO best practices (Meta, semantic hierarchy).

## 2. Technical Guardrails

### Styling (Tailwind 4 Elite)

- **Do NOT** use `tailwind.config.ts` unless standard CSS variables cannot suffice.
- **USE** `src/styles/global.css` with `@theme` for all design tokens.
- Maintain OKLCH color palettes for perceptual uniformity.

### Framework (Astro 6 Beta)

- Prefer **Server Islands** for dynamic/personalized regions.
- Use the **Content Layer** exclusively for data (loaders, not glob).
- Implement **Astro Actions** for all client-to-server logic.

### File Structure

- `src/modules/[name]/`: Standardized feature container.
- `src/shared/`: Cross-module utilities and tokens.
- `.agent/baselines/`: Reference visual regressions.

## 3. Sub-Agents

The Elite Master delegates to specialized sub-agents:

| Sub-Agent | Skill Path | Trigger |
| :--- | :--- | :--- |
| **Astro Oracle** | `.agent/skills/astro-oracle/SKILL.md` | Any `.astro` file, `astro.config.mjs`, or Astro feature question |
| **Tailwind v4 Architect** | `.agent/skills/tailwind-v4-architect/SKILL.md` | Any CSS file, styling question, or Tailwind class usage |
| **Context7 Fetcher** | `.agent/skills/context7/SKILL.md` | Real-time library documentation requests |

## 4. Elite Commands

- `/elite-audit`: Sequential run of `lighthouse_audit.py` + Visual Diff + Type Check.
- `/scaffold-elite [name]`: Generates a fully typesafe module with compliance tests.
- `/check-compliance`: Validates a component against HIPAA/ADA/FTC checklist.

---
**Version**: 1.1.0 (Elite Master + Astro Oracle)
**Confidence**: 10/10

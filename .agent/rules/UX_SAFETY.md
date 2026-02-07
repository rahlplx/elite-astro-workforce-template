# 🎨 UX Safety & Aesthetic Standards

This document defines the mandatory visual safety rules for all UI components generated or modified by the Elite Workforce.

## 1. Contrast Safety (P0)

- **Zero-Tolerance**: Never generate text-on-background combinations that result in low contrast (e.g., #000 on #050505).
- **Verification**: All colors must be validated against the active `vibe-themes.json`.
- **Constraint**: Use semantic foreground/background pairs (base-100, base-content, primary, primary-content) as defined in the DaisyUI/Tailwind theme.

## 2. Mobile-First Grid Protocol (P0)

- **Standard**: All layouts must start with a single-column grid for mobile.
- **Implementation**:
  - ✅ `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - ❌ `grid grid-cols-3` (Fails on mobile)
- **Peeking Carousel**: For lists of more than 4 items on mobile, use a peeking carousel layout (`w-[85vw]`) to maintain scanability.

## 3. Design Token Enforcement (P1)

- **Anti-Drift**: No raw hex codes, RGB, or HSL literals in component files.
- **Source of Truth**: Use `ATLAS_TOKENS` (CSS variables) or Tailwind utility classes that map to tokens.
- **Fluid Scales**: Spacing and typography must use fluid scales (clamp) to ensure consistency across breakpoints without manual intervention.

## 4. Interaction Guardrails (P2)

- **Touch Targets**: Interaction elements (buttons, links) must have a minimum touch target area of 44x44px for mobile accessibility.
- **Focus States**: Every interactive element must have a clearly visible `:focus-visible` state.

---

**Status**: MANDATORY
**Enforced By**: .agent/orchestration/guardrails.ts

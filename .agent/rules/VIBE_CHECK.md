# VIBE CHECK: TECHNICAL AESTHETICS

## 1. CODE ELEGANCE
- **Rule**: If a function is > 30 lines, refactor into smaller utilities.
- **Rule**: No "commented out" code. Use Git history instead.
- **Rule**: Self-documenting variables over inline comments.

## 2. VISUAL POLISH (UI)
- **Style**: Use "Glassmorphism" for high-density UI (Header, Modals).
- **Colors**: Strict OKLCH adherence for vibrant, consistent gradients.
- **Animation**: Micro-interactions (hover, focus) must be < 150ms.
- **Empty States**: Never show a blank page; use skeleton loaders or placeholders.

## 3. PREMIUM DESIGN LANGUAGE
- **Typography**: `text-balance` for all H1/H2 titles.
- **Spacing**: Use the 4px mathematical scale exclusively.
- **Shadows**: Use DaisyUI elevation tokens, never arbitrary `box-shadow` values.

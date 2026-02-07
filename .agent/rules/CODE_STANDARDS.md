# CODE STANDARDS

## 1. PRIMARY TECH STACK
- **Framework**: Astro 6.x (Server Islands, Content Layer, Actions)
- **Styling**: Tailwind CSS 4+ (@theme directive, OKLCH space)
- **Components**: DaisyUI 5 (Semantic classes)
- **Content**: Keystatic (JSON/Markdown local storage)

## 2. DEVELOPMENT STANDARDS
- **TypeScript**: Strict mode required. No `any`. Use Zod for boundary validation.
- **File Naming**: `kebab-case` for files/folders. `PascalCase` for components.
- **Imports**: Use path aliases (`@components/`, `@layouts/`, `@utils/`).
- **Styles**: CSS-First. DO NOT use `tailwind.config.ts` unless standard CSS variables cannot suffice.

## 3. ACCESSIBILITY (NON-NEGOTIABLE)
- **Compliance**: WCAG 2.1 AA minimum.
- **Contrast**: 4.5:1 for text.
- **Interactive**: Minimum 48px touch targets. Full keyboard support.
- **Semantic HTML**: Use native elements over ARIA where possible.

## 4. DESIGN TOKENS
- **Semantic Names**: Use `primary`, `surface`, `accent` (Refer to `ATLAS_TOKENS.md`).
- **NO Hex codes**: Use variables or OKLCH tokens.

---
version: 1.0.0
name: Tailwind v4 Architect
description: Master guide for Tailwind CSS v4. Enforces CSS-first configuration, native container queries, and Vite-native performance patterns.
---

# Tailwind v4 Architect

> **⚠️ CORE DIRECTIVE**: Treat CSS as the configuration source. Tailwind v4 puts CSS variables and the `@theme` directive at the center of the architecture.

## 1. CSS-Native Configuration

**DO NOT** use `tailwind.config.js` unless absolutely necessary for complex JavaScript plugins.
**DO** use strict CSS variables for theming.

### Required Setup (`src/styles/global.css`)

```css
@import "tailwindcss";

@theme {
  /* Semantic Tokens (oklch preferred for wide gamut) */
  --color-primary: oklch(0.55 0.25 260); /* Blue-ish */
  --color-accent: oklch(0.85 0.15 85);   /* Gold-ish */
  
  /* Fluid Spacing */
  --spacing-4xl: 2.25rem;
  
  /* Fonts */
  --font-display: "Playfair Display", serif;
}
```

## 2. Vite-Native Integration

Tailwind 4 is a PostCSS plugin no more—it's a native Vite plugin.
**Verified Config** (`astro.config.mjs`):

```javascript
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  vite: { plugins: [tailwindcss()] }
});
```

## 3. Container Queries (Standard)

Stop using media queries for components. Use container queries to make components portable.

- **Parent**: `@container`
- **Child**: `@md:flex-row` (Apply styles based on parent width)

## 4. Modern Anti-Patterns (To Avoid)

- ❌ `@apply` for simple utilities (creates bloat)
- ❌ `tailwind.config.js` for simple colors
- ❌ `@import` from npm packages (Tailwind 4 verifies these automatically)

## 5. Verification

- Use `npx tailwindcss --help` to verify CLI availability.
- Check browser devtools: CSS variables should appear on `:root`.
- HMR should be <50ms.

---

## 6. Detailed Tailwind v4 Patterns (Reference from tailwind-patterns)

### Container Queries (v4 Native)

| Type | Responds To | Syntax |
| :--- | :--- | :--- |
| **Breakpoint** | Viewport width | `md:` |
| **Container** | Parent width | `@container` (parent) -> `@md:` (child) |

**Usage Strategy:**
- Page layouts: Viewport breakpoints (`md:`, `lg:`)
- Reusable components: Container queries (`@container`)

### Modern Layout Patterns

**Flexbox:**
- Center: `flex items-center justify-center`
- Stack: `flex flex-col gap-4`
- Wrap: `flex flex-wrap gap-4`

**Grid:**
- Auto-fit: `grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))]`
- Sidebar: `grid grid-cols-[auto_1fr]`
- **Preference**: Use asymmetric/organic grids over rigid 3-column grids for modern look.

## 7. Component Extraction Strategy

| Signal | Action |
| :--- | :--- |
| Same classes 3+ times | Extract component |
| Complex state | Extract to React/Astro component |
| Design token | Extract to `@theme` |

## 8. Migration: v3 to v4
- **No `tailwind.config.js`** (unless indispensable plugins)
- **No PostCSS** (native Oxide engine)
- **No `@apply`** (use components or raw CSS)
- **Theme in CSS**: Use `@theme { ... }` in global CSS.

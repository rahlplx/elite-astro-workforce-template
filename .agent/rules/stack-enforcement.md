# Stack Enforcement Rules (Astro 6 / Tailwind CSS 4)

> **Zero-Legacy Tolerance Policy**
> This project enforces 2026-era patterns exclusively. Any pre-2026 configuration will be rejected.

---

## Tailwind CSS 4 Configuration

### FORBIDDEN FILES
The following files are **strictly prohibited**. If detected, they must be **deleted immediately**:

- `tailwind.config.js`
- `tailwind.config.ts`
- `tailwind.config.mjs`
- `postcss.config.js`
- `postcss.config.mjs`
- `postcss.config.cjs`

### REQUIRED CONFIGURATION
All Tailwind configuration MUST live in `src/styles/global.css` using the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Design tokens defined here */
  --color-primary: oklch(65% 0.25 250);
  --color-secondary: oklch(55% 0.20 320);
  --font-family-sans: "Inter Variable", system-ui, sans-serif;
  --spacing-section: 6rem;
}
```

### VITE INTEGRATION
Tailwind MUST be loaded via the Vite plugin in `astro.config.mjs`:

```javascript
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Never use** `@astrojs/tailwind` — this is a legacy Astro 4 integration.

---

## CSS-First Principles

### REQUIRED PATTERNS

| Pattern | Status |
|---------|--------|
| Native CSS variables (`--custom-property`) | REQUIRED |
| `oklch()` color functions | REQUIRED |
| `@layer base/components/utilities` | REQUIRED |
| CSS nesting (native) | REQUIRED |
| Container queries (`@container`) | PREFERRED |

### FORBIDDEN PATTERNS

| Pattern | Status | Replacement |
|---------|--------|-------------|
| `@apply` directive | BANNED | Write CSS directly |
| `theme()` function | BANNED | Use `var(--theme-*)` |
| Hex colors (`#rrggbb`) | DEPRECATED | Use `oklch()` |
| `rgb()`/`hsl()` | DEPRECATED | Use `oklch()` |
| JavaScript-based theming | BANNED | Use CSS `@media (prefers-color-scheme)` |

### COLOR SYSTEM
All colors must use OKLCH for perceptual uniformity:

```css
@theme {
  --color-success: oklch(72% 0.19 145);
  --color-warning: oklch(85% 0.18 85);
  --color-error: oklch(62% 0.25 25);
}
```

---

## Astro 6 Native Patterns

### Content Layer API
All content MUST use the Content Layer API. Collections are defined in `src/content.config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/modules/blog/content' }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

### FORBIDDEN LEGACY PATTERNS

| Pattern | Status | Replacement |
|---------|--------|-------------|
| `getStaticPaths()` for collections | BANNED | Use Content Layer loaders |
| `Astro.glob()` | DEPRECATED | Use `getCollection()` |
| `src/content/` directory | LEGACY | Use `src/modules/[name]/content/` |
| `@astrojs/image` | REMOVED | Use native `<Image />` from `astro:assets` |

### Server Actions
Forms MUST use Server Actions:

```astro
---
import { actions } from 'astro:actions';
---

<form method="POST" action={actions.contact.submit}>
  <input name="email" type="email" required />
  <button>Submit</button>
</form>
```

---

## Dependency Rules

### Node.js Version
- **Minimum:** Node.js 22.0.0
- **LTS Target:** Node.js 22.x

### Package Constraints
- Never downgrade core dependencies via `npm audit fix`
- Reject any dependency requiring Node.js < 22
- Prefer ESM-only packages

### Forbidden Dependencies
| Package | Reason |
|---------|--------|
| `@astrojs/tailwind` | Legacy Astro 4 integration |
| `autoprefixer` | Unnecessary with Tailwind 4 |
| `postcss` (standalone) | Tailwind 4 handles internally |
| `@apply` plugins | Violates CSS-first principle |

---

## Verification Checklist

Before any commit, verify:

- [ ] No `tailwind.config.*` files exist
- [ ] No `postcss.config.*` files exist
- [ ] `@tailwindcss/vite` is the only Tailwind integration
- [ ] All colors use `oklch()` format
- [ ] No `@apply` directives in CSS
- [ ] Content uses Content Layer API (not `getStaticPaths`)
- [ ] Forms use Server Actions

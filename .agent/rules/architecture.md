# Architecture Rules (Module-First Design)

> **Zero-JS Default Philosophy**
> Every component renders as static HTML unless interactivity is impossible without JavaScript.

---

## Module Isolation

### Directory Structure
All features MUST live in isolated modules:

```
smile-savers-site/src/
├── modules/
│   ├── blog/
│   │   ├── components/
│   │   ├── content/
│   │   ├── assets/
│   │   ├── styles/
│   │   └── pages/
│   ├── shop/
│   │   ├── components/
│   │   ├── content/
│   │   ├── assets/
│   │   ├── styles/
│   │   └── pages/
│   └── appointments/
│       ├── components/
│       ├── content/
│       ├── assets/
│       ├── styles/
│       └── pages/
├── layouts/
├── components/          # Shared components only
├── styles/
│   └── global.css       # Tailwind 4 @theme config
└── pages/
    └── index.astro      # Root redirect or landing
```

### Module Requirements

Each module MUST contain:

| Directory | Purpose | Required |
|-----------|---------|----------|
| `components/` | Module-specific Astro components | Yes |
| `content/` | Markdown/MDX content for Content Layer | If applicable |
| `assets/` | Images, fonts, videos for this module | If applicable |
| `styles/` | Module-scoped CSS overrides | Optional |
| `pages/` | Route handlers (copied to `src/pages/` via routing) | Yes |

### Cross-Module Communication
- Modules MUST NOT import from other modules directly
- Shared logic goes in `src/lib/`
- Shared components go in `src/components/`
- Shared types go in `src/types/`

---

## Asset Colocation

### FORBIDDEN: Public Folder Pollution
Do NOT place module-specific assets in `public/`:

```
# BAD
public/
├── blog/
│   └── hero.webp
├── shop/
│   └── product-1.webp
```

### REQUIRED: Colocated Assets
Assets MUST live within their module:

```
# GOOD
src/modules/blog/
├── assets/
│   └── hero.webp
├── components/
│   └── Hero.astro    # Imports ../assets/hero.webp
```

### Asset Import Pattern
```astro
---
import heroImage from '../assets/hero.webp';
import { Image } from 'astro:assets';
---

<Image src={heroImage} alt="Blog hero" />
```

### Public Folder Allowed Contents
Only these belong in `public/`:
- `favicon.ico` / `favicon.svg`
- `robots.txt`
- `sitemap.xml` (if static)
- `manifest.webmanifest`
- OpenGraph fallback images (if truly global)

---

## Zero-JS Default

### Component Hydration Rules

| Scenario | Solution | Client Directive |
|----------|----------|------------------|
| Static content | Astro component | None (default) |
| Accordion/disclosure | `<details>` + `<summary>` | None |
| Tabs | CSS `:target` or radio buttons | None |
| Carousel | CSS scroll-snap | None |
| Modal | `<dialog>` element | None |
| Hover effects | CSS `:hover` / `:focus-within` | None |
| Form validation | HTML5 validation + Server Actions | None |
| Page transitions | View Transitions API | None |
| Complex state (cart, auth) | Island architecture | `client:visible` |

### Hydration Decision Tree

```
Is interactivity needed?
├── No → Astro component (zero JS)
└── Yes → Can it be done with HTML/CSS?
    ├── Yes → Use native HTML/CSS (zero JS)
    └── No → Can it wait for visibility?
        ├── Yes → client:visible
        └── No → client:load (rare, justify in comment)
```

### Pre-render Default
All pages default to static generation:

```astro
---
// This is the DEFAULT - no need to specify
export const prerender = true;
---
```

Only opt-out for dynamic routes:
```astro
---
// Explicitly opt-out for SSR-required routes
export const prerender = false;
---
```

---

## Strict Typing

### Zod Schema Requirements
All content collections MUST have Zod schemas:

```typescript
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/modules/services/content' }),
  schema: z.object({
    title: z.string().min(1).max(100),
    description: z.string().max(300),
    price: z.number().positive(),
    duration: z.number().int().positive(), // minutes
    category: z.enum(['cleaning', 'cosmetic', 'surgical', 'preventive']),
    featured: z.boolean().default(false),
    image: z.string().optional(),
  }),
});
```

### TypeScript Rules
- No `any` type — use `unknown` with type guards
- No `// @ts-ignore` — fix the type issue
- No `as` assertions without runtime validation
- Enable `strict: true` in `tsconfig.json`

### Props Typing
```astro
---
interface Props {
  title: string;
  description?: string;
  variant: 'primary' | 'secondary';
}

const { title, description, variant = 'primary' } = Astro.props;
---
```

---

## Component Guidelines

### File Naming
- Components: `PascalCase.astro`
- Pages: `kebab-case.astro` or `[param].astro`
- Utilities: `camelCase.ts`
- Types: `PascalCase.ts`

### Component Size Limits
| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| Gzipped payload | 20kb | Halt, request authorization |
| Lines of code | 200 | Consider splitting |
| Props count | 8 | Consider composition |

### Accessibility Requirements
- All images require `alt` text
- All interactive elements require focus states
- Color contrast ratio: minimum 4.5:1 (WCAG AA)
- Forms require associated labels
- Landmarks: `<main>`, `<nav>`, `<header>`, `<footer>`

---

## Routing Strategy

### File-Based Routing
Module pages are linked via `src/pages/`:

```
src/pages/
├── index.astro                    # Landing page
├── blog/
│   ├── index.astro               # → imports from modules/blog/
│   └── [...slug].astro           # → dynamic blog posts
├── services/
│   └── index.astro               # → imports from modules/services/
└── appointments/
    └── book.astro                # → imports from modules/appointments/
```

### Dynamic Routes with Content Layer
```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';
import BlogPost from '../../modules/blog/components/BlogPost.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
---

<BlogPost {post} />
```

---

## Verification Checklist

Before any commit, verify:

- [ ] New features live in `src/modules/[name]/`
- [ ] Assets are colocated, not in `public/`
- [ ] Components use zero-JS by default
- [ ] `client:*` directives are justified
- [ ] Zod schemas validate all content
- [ ] No `any` types in TypeScript
- [ ] Accessibility landmarks present
- [ ] Component payload < 20kb gzipped

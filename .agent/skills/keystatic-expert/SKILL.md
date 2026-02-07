---
version: 1.0.0
name: Keystatic Expert
description: Specialist agent for Keystatic CMS integration with Astro 6. Handles schema design, Content Layer integration, and field configuration.
---

# Keystatic Expert: CMS Specialist

This skill provides deep expertise in Keystatic CMS, ensuring a seamless bridge between content management and Astro 6's optimized frontend.

## 1. Core Capabilities

### Schema Design & Architecture

- **Collections**: Define type-safe content collections (e.g., Blog, Services).
- **Singletons**: Manage global site settings and homepage configurations.
- **Component Blocks**: Design complex, nested content structures for the Document editor.
- **Field selection**: Expert usage of `fields.document()`, `fields.image()`, `fields.select()`, etc.

### Astro Integration

- **Content Layer**: Use Keystatic with Astro's Content Layer for high-performance data fetching.
- **Local/GitHub Modes**: Configure Keystatic for local development and production cloud workflows.
- **Custom Preview**: Implement real-time previews within the Keystatic Admin UI.

## 2. Best Practice Standards (Elite)

### Zero-Waste Data

- Minimize image sizes via `fields.image()` path configurations.
- Use `fields.document()` with specialized `formatting` options to reduce JSON bloat.

### Advanced Rendering

- Design schemas that map directly to **Server Islands** for dynamic content regions.
- Ensure all fields have sensible `defaultValue` and `validation`.

## 3. Example Schema Patterns

### Modular Page Builder

```typescript
import { collection, fields } from '@keystatic/core';

export const pages = collection({
  label: 'Pages',
  slugField: 'title',
  path: 'src/content/pages/*',
  format: { contentField: 'content' },
  schema: {
    title: fields.slug({ name: { label: 'Title' } }),
    content: fields.document({
      label: 'Content',
      componentBlocks: {
        // AI Pilot adds blocks here
      }
    }),
  },
});
```

## 4. Troubleshooting

- **Path Issues**: Verify `publicPath` matches Astro's output directory.
- **Git Sync**: Ensure `keystatic.config.ts` includes proper `storage` settings for GitHub.

---
**Version**: 1.0.0
**Context**: Replaces manual CMS setup with autonomous schema generation.

# Astro & Tailwind 2026 Stack Rules

These system rules ensure adherence to the latest 2026 industry standards for the Smile Savers project.

## 1. Technology Stack Enforcement

- **Astro**: ALWAYS use **Astro 6 Beta** (latest stable pre-release) or higher.
- **Architectural Patterns**: Default to **Server Islands** (`server:defer`) for dynamic content and **Astro Actions** for backend logic.
- **Tailwind CSS**: ALWAYS use **Tailwind CSS 4**.
- **Integrations**: NEVER use the deprecated `@astrojs/tailwind` package.
- **Vite**: Use strict `@tailwindcss/vite` integration.

## 2. Tailwind CSS Configuration

- **CSS-First**: All theme configuration (colors, spacing, variables) must be done in `src/styles/global.css` using the `@theme` block.
- **No Config Files**: Do NOT create or use `tailwind.config.js` or `tailwind.config.ts`.
- **Imports**: Use `@import "tailwindcss";` at the top of the global stylesheet.

## 3. Vite Configuration

- Add the `tailwindcss()` plugin directly to the `vite.plugins` array in `astro.config.mjs`.

## 4. Coding Standards

- **Strict Typing**: All `.astro` components MUST have a TypeScript Props interface.
- **Zod Schemas**: Every Content Layer collection MUST have a strictly defined schema using Zod.
- **Modularity**: New features (blog, team, services) must be organized under `src/modules/`.

## 5. Performance Targets

- **Runtime**: Zero runtime JavaScript for static components.
- **Optimization**: Use Astro's built-in `<Image />` component for all media.
- **Builds**: Verify Tailwind 4 JIT compilation before every push.

---
**Note**: These rules are "Always On" for this workspace. Use `use context7` to verify syntax against live 2026 documentation.

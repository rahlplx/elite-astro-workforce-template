---
description: Scaffold a new elite module with Astro 6 and Tailwind 4 standards
---

# Elite Module Scaffold (/scaffold-elite [name])

Automates feature creation with absolute consistency.

1. **Structure Creation:**
   - Create `src/modules/{name}/`.
   - Parallel: `components/`, `layouts/`, `pages/`, `services/`.
2. **Dependency Injection:**
   - Inject required metadata into `src/content.config.ts`.
   - Add entry point to main navigation array if applicable.
3. **Template Application:**
   - Generate `{name}.astro` with standard Props interface.
   - Apply Tailwind 4 `@theme` consumption rules.
4. **Validation:**
   - Run `astro check` on the new module only.
   - Mock a visual regression baseline in `.agent/baselines/`.

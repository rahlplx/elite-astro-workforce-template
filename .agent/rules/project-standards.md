# Smile Savers Project Standards & Agent Rules

These rules are enforced to ensure clean code, premium UI/UX, and bug-free implementation for the Smile Savers project.

## 1. Core Philosophy: Modular & Clean

- **DRY (Don't Repeat Yourself)**: If you copy-paste code more than twice, extract it into a reusable component or utility.
- **Component-First**: Build small, focused Astro components. Avoid monolithic files.
- **Strict Typing**: TypeScript is not optional. Define interfaces for all props and data models/
- **Latest Stable**: Always use the latest stable versions of dependencies (Astro, Tailwind, React, etc.).

## 2. UI/UX Implementation Rules

- **Mobile-First**: Design for 375px width first, then scale up.
- **Premium Aesthetics**:
  - Use the project's design tokens (Professional Blue `#2d54ff`, Trust Gold `#d4a574`).
  - Implement smooth micro-interactions (hover states, transitions).
  - Use `design-tokens.css` variables instead of magic numbers.
- **Accessibility (A11y)**:
  - All interactive elements must have `aria-label` or accessible text.
  - Color contrast must meet WCAG 2.1 AA (4.5:1).
  - Touch targets must be ≥48px.

## 3. Development Workflow

1. **Plan First**: Before writing code, outline the component structure and data flow.
2. **Consult Skills**:
   - Styling? Check `tailwind-patterns` skill.
   - New Component? Check `smile-savers-mobile-ui` examples.
   - Documentation? Use `context7` to fetch latest docs.
3. **Verify**: Run `pnpm check` and `pnpm lint` before finishing a task.

## 4. Error Prevention

- **Input Validation**: Validate all props and user inputs.
- **Error Boundaries**: Handle failures gracefully (e.g., failed API calls, missing images).
- **No `any`**: Avoid TypeScript `any` type. Use specific types or generics.

## 5. Technology Stack Standards (Latest Stable)

- **Framework**: Astro 5.x+ (Latest Stable) - Use Server Islands & Content Layer
- **Styling**: Tailwind CSS v4.x (Latest Stable) - Use CSS-native config (`@theme`)
- **Icons**: Lucide React (Latest) + SVG Sprites
- **Language**: TypeScript 5.x+ (Strict Mode)
- **Runtime**: Node.js LTS (22.x+) or Compatible (Bun/deno if specified)

## 6. Stack Verification (Context7)

Before starting any implementation:

1. **Fetch Latest Docs**: Use `use context7` to get the newest syntax.

    ```bash
    "How do I configure [Tool] in [Version]? use context7"
    ```

2. **Verify Patterns**: Check if `tailwind-patterns` (v4) or `smile-savers-mobile-ui` examples align with the latest docs. If not, prefer the official docs served by Context7.
3. **Update Dependencies**: Ensure `package.json` uses `"latest"` or specific recent versions.

---
**Note**: These rules apply to all AI agents. When in doubt, ASK Context7.

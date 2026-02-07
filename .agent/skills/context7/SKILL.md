---
version: 1.0.0
name: Context7 Documentation Fetcher
description: Fetch up-to-date library documentation for Astro, Tailwind CSS, TypeScript, and other Elite Workforce project dependencies using Context7 MCP
---

# Context7 Documentation Fetcher

> **⚠️ IMPORTANT: Always Use Latest Stable Versions**
>
> When using Context7 or generating code, **always fetch and use the LATEST STABLE versions** of all libraries, frameworks, and dependencies. Never use deprecated APIs or outdated syntax.

This skill integrates **Context7 MCP** to fetch up-to-date, version-specific documentation for the Elite Workforce dental practice website project.

## What is Context7?

Context7 is an MCP server that pulls current documentation and code examples directly into your prompts, preventing:

- ❌ Outdated code examples from old training data
- ❌ Hallucinated APIs that don't exist
- ❌ Generic answers for old package versions

## Quick Usage

Add `use context7` to any prompt to fetch current documentation:

```markdown
Create an Astro component for a responsive card grid. use context7
```

Or specify a library directly:

```bash
How do I configure dark mode in Tailwind CSS 3.4? use library /tailwindlabs/tailwindcss
```

---

## Elite Workforce Project Libraries

Below are the Context7 library IDs for all dependencies in this project. Use these when you need specific documentation.

### Core Framework

| Library | Context7 ID | Version | Usage |
| :--- | :--- | :--- | :--- |
| **Astro** | `/withastro/astro` | Latest Stable | Static site framework |
| **Tailwind CSS** | `/tailwindlabs/tailwindcss` | Latest Stable | Utility CSS |
| **TypeScript** | `/microsoft/typescript` | Latest Stable | Type safety |

### Astro Integrations

| Library | Context7 ID | Usage |
| :--- | :--- | :--- |
| **@tailwindcss/vite** | `/withastro/astro` | Tailwind integration |
| **@astrojs/check** | `/withastro/astro` | Type checking |

### Accessibility & Testing

| Library | Context7 ID | Usage |
| :--- | :--- | :--- |
| **pa11y** | - | Accessibility auditing |
| **Lighthouse** | `/AuditBuddy/lighthouse-ci` | Performance auditing |

---

## Common Prompts for Elite Workforce

### Astro Components

```markdown
Create an Astro component that accepts TypeScript props with default values. use library /withastro/astro
```

```markdown
How do I pass data from Astro pages to components? use context7
```

```markdown
Show me how to use Astro's Content Collections for blog posts. use library /withastro/astro
```

### Tailwind CSS

```markdown
How do I add custom colors to Tailwind config? use library /tailwindlabs/tailwindcss
```

```markdown
What's the correct way to implement dark mode with class strategy in Tailwind 3.4? use context7
```

```markdown
How do I create custom animations in Tailwind CSS? use library /tailwindlabs/tailwindcss
```

### Accessibility

```markdown
How do I make accessible cards with proper ARIA labels? use context7
```

```markdown
What are the WCAG 2.1 AA color contrast requirements? use context7
```

### Performance

```markdown
How do I optimize images in Astro using astro:assets? use library /withastro/astro
```

```markdown
What's the best way to lazy load components in Astro? use context7
```

---

## Setup Instructions

### Option 1: Add to Agent Rules (Recommended)

Add this rule to automatically use Context7 for code-related questions:

```markdown
Always use Context7 MCP when I need library/API documentation, code generation, 
setup or configuration steps for Astro, Tailwind CSS, or TypeScript without me 
having to explicitly ask.
```

**Location:**

- Cursor: Settings → Cursor Settings → Rules
- Claude Code: Add to CLAUDE.md in project root
- Antigravity: Global rules file

### Option 2: Manual Usage

Just append `use context7` to any prompt:

```markdown
How do I create a responsive grid in Astro with Tailwind? use context7
```

---

## Version-Specific Documentation

Elite Workforce uses specific versions. Mention them for accurate docs:

```markdown
How do I set up Tailwind CSS 3.4 with Astro 4? use context7
```

```markdown
Show me TypeScript 5 strict mode configuration for Astro. use context7
```

---

## Elite Workforce Rule Template

Add this complete rule to enable Context7 for all Elite Workforce development:

```markdown
## Elite Workforce Development Rules

When working on the Elite Workforce dental practice website:

1. **Always use Context7** for Astro, Tailwind CSS, and TypeScript documentation
2. **ALWAYS use LATEST STABLE versions:**
   - Astro: Latest Stable (use library /withastro/astro)
   - Tailwind CSS: Latest Stable (use library /tailwindlabs/tailwindcss)
   - TypeScript: Latest Stable (use library /microsoft/typescript)
   - All other dependencies: Latest Stable versions only

3. **Apply these constraints:**
   - Mobile-first responsive design (2-col → 3-col → 4-col)
   - WCAG 2.1 AA accessibility compliance
   - Dark/Light mode with class strategy
   - Zero runtime JavaScript (pure Astro static)
   - Lighthouse 98+ performance score

4. **Use Elite Workforce design tokens:**
   - Primary: #2d54ff (Professional Blue)
   - Accent: #d4a574 (Trust Gold)
   - Font: Playfair Display (headings), Geist Sans (body)
```

---

## Troubleshooting

### "Library not found"

If Context7 can't find a library, try:

1. Use the resolve-library-id tool first
2. Check <https://context7.com> for available libraries
3. Use a more common library name

### "Outdated information returned"

Specify the version explicitly:

```markdown
How do I use Astro 4.16 content collections? use context7
```

### "Rate limit exceeded"

Get a free API key at <https://context7.com/dashboard> for higher limits.

---

## Integration with Elite Workforce Mobile UI Skill

Use Context7 alongside the Elite Workforce Mobile UI skill:

```markdown
Using the Elite Workforce Mobile UI skill, create a new FeatureCTA card component. 
Fetch current Astro component syntax. use context7
```

This ensures you get:

- ✅ Current Astro syntax from Context7
- ✅ Elite Workforce design patterns from the skill
- ✅ Correct TypeScript interfaces
- ✅ Accessibility compliance built-in

---

## Quick Reference Card

| Task | Prompt |
| :--- | :--- |
| Astro component help | `use library /withastro/astro` |
| Tailwind classes | `use library /tailwindlabs/tailwindcss` |
| TypeScript types | `use library /microsoft/typescript` |
| General docs | `use context7` |
| Specific version | Include version in prompt |

---

## Project-Specific Context7 Commands

### Creating New Components

```markdown
Create a premium dental service card component in Astro with TypeScript props, 
Tailwind styling, dark mode support, and WCAG 2.1 AA accessibility. 
use library /withastro/astro use library /tailwindlabs/tailwindcss
```

### Implementing Animations

```markdown
Add smooth hover animations to cards using Tailwind CSS keyframes 
that respect prefers-reduced-motion. use library /tailwindlabs/tailwindcss
```

### Setting Up Testing

```markdown
How do I run Lighthouse CI in a GitHub Actions workflow for an Astro site? 
use context7
```

### Optimizing Performance

```markdown
What's the best way to optimize LCP for an Astro static site? 
use library /withastro/astro
```

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Dependencies**: Context7 MCP Server

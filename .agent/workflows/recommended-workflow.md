---
description: Recommended AI Agent workflow for Elite Workforce development
---

# Recommended Agent Workflow

This workflow outlines the optimal process for using the AI Agent system on the Elite Workforce project.

## 1. Daily Development Cycle

### Morning Setup (5 min)

```bash
# Start dev server
npm run dev

# Run sentinel check
npm run sentinel

# Verify no type errors
npm run check
```

### Feature Development (Standard Flow)

#### Step 1: Activate Elite Mode

```text
Activate Elite Master mode for [feature name]
```

The Elite Master will automatically delegate to:

- **Astro Oracle**: For Astro-specific questions
- **Tailwind v4 Architect**: For styling
- **Context7**: For real-time library docs

#### Step 2: Plan the Feature

```text
Create an implementation plan for [feature description]
```

The agent will:

1. Create `implementation_plan.md` in the brain folder
2. Break down the work into tasks
3. Request your review before proceeding

#### Step 3: Execute the Plan

After approving the plan:

```text
Proceed with implementation
```

The agent will:

1. Create/modify files according to the plan
2. Run `npm run sentinel` to verify no errors
3. Create a walkthrough document

#### Step 4: Verify the Work

```text
Run /elite-audit
```

This will:

- Run Lighthouse audit
- Check visual regressions (if baselines exist)
- Verify TypeScript types
- Check HIPAA/ADA compliance

## 2. Astro-Specific Workflows

### Creating a New Component

```text
Astro Oracle: Create a [component type] component with [requirements]
```

Example:

```text
Astro Oracle: Create a responsive Testimonial card component with TypeScript props for name, quote, rating, and avatar image.
```

### Debugging Astro Issues

```text
Astro Oracle: I'm getting [error message]. How do I fix this?
```

The Oracle will:

1. Query the `astro-docs` MCP
2. Check the cached documentation
3. Provide a solution with source citations

### Content Collections

```text
Astro Oracle: Show me how to create a content collection for [content type]
```

## 3. Styling Workflows

### Tailwind v4 Configuration

```text
Use Tailwind v4 Architect to add a new design token for [purpose]
```

The agent will:

1. Update `src/styles/global.css` with `@theme` syntax
2. Ensure OKLCH color space compliance
3. Maintain the existing design system

### Component Styling

```text
Style the [component name] using the Premium Teal design system
```

## 4. Compliance Workflows

### HIPAA/ADA Check

```text
Run /check-compliance on [component/page]
```

The agent will verify:

- No PHI in forms or URLs
- WCAG 2.1 AA color contrast
- Keyboard navigation
- Touch target sizes (≥48px)

## 5. Deployment Workflows

### Pre-Deployment Checklist

```bash
# Run all checks
npm run sentinel
npm run build

# Verify build output
npm run preview
```

### Elite Deployment

```text
Run /elite-deploy
```

This will:

1. Run full audit suite
2. Generate deployment report
3. Verify all compliance checks

## 6. Emergency Debugging

### When Something Breaks

```text
Activate systematic debugging mode for [issue description]
```

The agent will:

1. Reproduce the issue
2. Analyze root cause
3. Propose and implement fix
4. Verify the solution

## 7. Background Automation

### Lefthook (Git Hooks)

Automatically runs on every commit:

- `npm run sentinel` (Astro check)
- Blocks commits with type errors

### Continuous Monitoring

```bash
# Watch mode (optional)
npm run dev & npm run sentinel -- --watch
```

## 8. Best Practices

### DO

✅ Always start with "Activate Elite Master mode"
✅ Review implementation plans before approval
✅ Use specific, detailed prompts
✅ Run `/elite-audit` before major commits
✅ Keep the dev server running

### DON'T

❌ Skip the planning phase for complex features
❌ Ignore lint warnings
❌ Commit without running sentinel
❌ Use generic prompts like "fix this"
❌ Disable Lefthook hooks

## 9. Skill Activation Quick Reference

| Task | Activation Phrase |
| :--- | :--- |
| General Development | `Activate Elite Master mode` |
| Astro Questions | `Astro Oracle: [question]` |
| Styling | `Use Tailwind v4 Architect` |
| Library Docs | `Use Context7 for [library]` |
| Compliance Check | `Run /check-compliance` |
| Full Audit | `Run /elite-audit` |
| New Module | `Run /scaffold-elite [name]` |

## 10. Troubleshooting

### Agent Not Responding

1. Check if you're in an active task (look for ephemeral message)
2. Type "continue" to resume
3. Restart the agent session if needed

### Sentinel Failing

```bash
# View detailed errors
npm run check

# Fix automatically (if possible)
npm run format
```

### Cache Issues

```bash
# Clear Astro cache
npm run clean

# Rebuild
npm run build
```

---

**Version**: 1.0.0
**Last Updated**: February 2026
**Maintained By**: Elite Master Agent

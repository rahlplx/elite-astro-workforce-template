# Elite Workforce Workflows

Guided step-by-step workflows for common Astro development tasks. These workflows are designed for **vibe coders** - non-technical users who want to build with AI assistance.

## Quick Reference

| Workflow | Description | Risk |
|----------|-------------|------|
| [01-full-audit](01-full-audit.md) | Complete project audit | 🟢 SAFE |
| [02-create-page](02-create-page.md) | Create new pages | 🟡 LOW |
| [03-add-component](03-add-component.md) | Add reusable components | 🟡 LOW |
| [04-deploy-vercel](04-deploy-vercel.md) | Deploy to Vercel | 🟠 MEDIUM |
| [05-seo-optimization](05-seo-optimization.md) | SEO setup and optimization | 🟡 LOW |
| [06-add-form](06-add-form.md) | Contact/newsletter forms | 🟡 LOW |
| [07-setup-cms](07-setup-cms.md) | Keystatic CMS integration | 🟠 MEDIUM |
| [10-emergency-rollback](10-emergency-rollback.md) | Undo changes | 🟠 MEDIUM |

## How Workflows Work

1. **You describe what you want** in plain English
2. **AI selects the right workflow** automatically
3. **Risk is assessed** before any action
4. **Checkpoint is created** for risky operations
5. **Changes are made** safely
6. **You can rollback** if needed

## Risk Levels

| Level | Emoji | Description |
|-------|-------|-------------|
| SAFE | 🟢 | Read-only operations |
| LOW | 🟡 | Creates new files |
| MEDIUM | 🟠 | Modifies existing files |
| HIGH | 🔴 | Core system changes |
| CRITICAL | ⛔ | Requires explicit confirmation |
| BLOCKED | 🚫 | Not allowed |

## Example Conversations

### Simple Request
```
You: "Create an About page"
AI: [Activates 02-create-page workflow]
AI: [Creates src/pages/about.astro with SEO, layout, content]
```

### Complex Request
```
You: "Build a pricing page with 3 tiers and a FAQ section"
AI: [Activates 02-create-page + 03-add-component workflows]
AI: [Creates page, pricing cards, FAQ accordion]
```

### Problem Solving
```
You: "Something broke, undo everything"
AI: [Activates 10-emergency-rollback workflow]
AI: [Restores from checkpoint]
```

## Adding Custom Workflows

Create a new `.md` file in this folder following the template:

```markdown
# Workflow Name

> **Risk Level**: 🟡 LOW
> **Estimated Time**: X minutes
> **Tokens**: ~XXX

## What This Does
[Description]

## How to Use
[Example prompts]

## What You'll Get
[Expected output]
```

## All Available Workflows

### Creation
- `02-create-page.md` - New pages
- `03-add-component.md` - New components
- `06-add-form.md` - Contact/newsletter forms

### Deployment & SEO
- `04-deploy-vercel.md` - Deploy to Vercel
- `05-seo-optimization.md` - SEO setup

### Content Management
- `07-setup-cms.md` - Keystatic CMS integration

### Audit & Fix
- `01-full-audit.md` - Complete audit

### Recovery
- `10-emergency-rollback.md` - Undo changes

---

**Tip**: Just describe what you want, and the AI will pick the right workflow!

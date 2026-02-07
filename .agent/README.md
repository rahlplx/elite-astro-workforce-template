# Elite Agentic Workforce

This directory contains the complete AI Agent configuration for the Elite Agentic Workforce.

## 📁 Directory Structure

```
.agent/
├── README.md                 # This file
├── AGENT_PROTOCOL.md         # 🛡️ THE WORKFORCE SOUL (Core Identity)
├── mcp-servers.json          # MCP server configurations
├── skills/                   # Agent skill definitions
│   ├── astro-oracle/         # Astro framework expert
│   ├── elite-core/           # Master orchestrator
│   ├── tailwind-v4-architect/# Tailwind CSS v4 expert
│   ├── context7/             # Documentation fetcher
│   └── [50+ other skills]/   # Specialized capabilities
└── workflows/                # Workflow definitions
    ├── recommended-workflow.md  # ⭐ START HERE
    ├── elite-audit.md        # Full audit workflow
    ├── elite-deploy.md       # Deployment workflow
    └── scaffold-elite.md     # Module scaffolding
```

## 🚀 Quick Start

### 1. Read the Recommended Workflow

```bash
# View the master workflow guide
cat .agent/workflows/recommended-workflow.md
```

### 2. Activate Elite Mode

In your AI chat:

```text
Activate Elite Master mode
```

### 3. Start Development

```text
Create an implementation plan for [your feature]
```

## 🧠 Agent Skills

### Core Skills

| Skill | Purpose | Activation |
| :--- | :--- | :--- |
| **Elite Master** | Orchestrates all other skills | `Activate Elite Master mode` |
| **Astro Oracle** | Astro framework expertise | `Astro Oracle: [question]` |
| **Tailwind v4 Architect** | CSS-first styling | Auto-activated for CSS |
| **Context7** | Real-time library docs | `Use Context7 for [library]` |

### Specialized Skills

- **Elite Core**: Systems conscience & standards enforcement.
- **Systematic Debugging**: 4-phase debugging methodology
- **Plan Writing**: Structured task planning
- **Clean Code**: Pragmatic coding standards
- **Web Design Guidelines**: UI compliance checker

[View all 50+ skills in the `skills/` directory]

## 🔧 MCP Servers

### Active Servers

1. **astro-docs**: Official Astro documentation search
2. **daisyui**: DaisyUI component library docs
3. **sequential-thinking**: Chain-of-thought reasoning
4. **context7**: Real-time library documentation (via `.cursor/mcp.json`)

### Configuration

See `mcp-servers.json` for the full configuration.

## 📋 Workflows

### Available Workflows

| Workflow | Command | Purpose |
| :--- | :--- | :--- |
| Recommended | `/recommended-workflow` | Daily development cycle |
| Elite Audit | `/elite-audit` | Full compliance audit |
| Elite Deploy | `/elite-deploy` | Production deployment |
| Scaffold Elite | `/scaffold-elite [name]` | Create new module |
| Visual Check | `/check-visual` | Visual regression test |

### Creating Custom Workflows

1. Create a new `.md` file in `.agent/workflows/`
2. Add YAML frontmatter with `description`
3. Write step-by-step instructions
4. Use `// turbo` annotation for auto-run steps

Example:

```markdown
---
description: My custom workflow
---

# My Custom Workflow

1. Do this first
// turbo
2. Run this command automatically
3. Finish with this
```

## 🛡️ Background Automation

### Lefthook (Git Hooks)

Automatically runs on every commit:

```yaml
pre-commit:
  commands:
    sentinel:
      run: npm run sentinel
```

### Sentinel Script

```bash
# Manual run
npm run sentinel

# What it does
concurrently "npm run check"
```

## 📊 Agent Metrics

- **Total Skills**: 50+
- **Active MCP Servers**: 4
- **Workflows**: 7
- **Cached Docs**: 23 Astro pages
- **Compliance Checks**: HIPAA, ADA, FTC

## 🎯 Best Practices

### DO

✅ Start every session with "Activate Elite Master mode"
✅ Review implementation plans before approval
✅ Run `/elite-audit` before major commits
✅ Use specific, detailed prompts
✅ Keep skills updated

### DON'T

❌ Skip the planning phase
❌ Ignore lint warnings
❌ Commit without running sentinel
❌ Use vague prompts
❌ Disable git hooks

## 🔄 Updating the Agent System

### Update Skills

```bash
# Using skillfish (if available)
npx skillfish update

# Manual update
# Edit files in .agent/skills/
```

### Update MCP Servers

Edit `mcp-servers.json` or `.cursor/mcp.json`

### Update Workflows

Edit files in `.agent/workflows/`

## 📚 Documentation

- [Recommended Workflow](./workflows/recommended-workflow.md) - Start here
- [Elite Core Skill](./skills/elite-core/SKILL.md) - Master orchestrator
- [Astro Oracle Skill](./skills/astro-oracle/SKILL.md) - Astro expert
- [Compliance Checklist](../../../.gemini/antigravity/brain/[conversation-id]/compliance_checklist.md)

## 🆘 Troubleshooting

### Agent Not Responding

1. Type "continue" to resume
2. Check for active task (ephemeral message)
3. Restart agent session

### Sentinel Failing

```bash
npm run check  # View errors
npm run format # Auto-fix
```

### Skills Not Loading

1. Verify YAML frontmatter in `SKILL.md`
2. Check file permissions
3. Restart IDE

## 🤝 Contributing

To add a new skill:

1. Create `.agent/skills/[skill-name]/SKILL.md`
2. Add YAML frontmatter with `name` and `description`
3. Document activation phrases and capabilities
4. Update this README

---

**Version**: 1.0.0
**Last Updated**: February 2026
**Maintained By**: Elite Master Agent

---
description: Comprehensive repository cleanup workflow to remove non-web skills and optimize the agent workforce.
---

# Repository Cleanup Workflow

This workflow executes the cleanup plan defined in `CLEANUP_PLAN.md`.

## Prerequisites
- [ ] Ensure you are on a clean git branch.
- [ ] Review `CLEANUP_PLAN.md` for the full context.

## Steps

### 1. Create Backup Branch
// turbo
```bash
git checkout -b pre-cleanup-backup
git push origin pre-cleanup-backup
git checkout main
```

### 2. Remove Wrong Tech Stack (Phase 1)
Delete skills related to mobile, game, and non-target frameworks.
// turbo
```bash
rm -rf ".agent/skills/mobile-design"
rm -rf ".agent/skills/smile-savers-mobile-ui"
rm -rf ".agent/skills/game-development"
rm -rf ".agent/skills/nextjs-react-expert"
rm -rf ".agent/skills/python-patterns"
```

### 3. Remove Duplicate Skills (Phase 2)
Delete skills that are superseded by newer or more specific ones.
// turbo
```bash
rm -rf ".agent/skills/frontend-design"
rm -rf ".agent/skills/tailwind-patterns"
```

### 4. Remove Infrastructure/DevOps Skills (Phase 3)
Delete skills related to server management and ops, as this is a managed web project.
// turbo
```bash
rm -rf ".agent/skills/server-management"
rm -rf ".agent/skills/red-team-tactics"
rm -rf ".agent/skills/bash-linux"
rm -rf ".agent/skills/powershell-windows"
rm -rf ".agent/skills/nodejs-best-practices"
```

### 5. Remove Meta/Unclear Skills (Phase 4)
Delete skills with unclear value or high abstraction cost.
// turbo
```bash
rm -rf ".agent/skills/mcp-builder"
rm -rf ".agent/skills/parallel-agents"
rm -rf ".agent/skills/module-generator"
rm -rf ".agent/skills/vibe-guard"
rm -rf ".agent/skills/identity-bootstrap"
```

### 6. Remove App-Builder Templates (Phase 5)
Delete templates for non-web platforms.
// turbo
```bash
rm -rf ".agent/skills/app-builder/templates/chrome-extension"
rm -rf ".agent/skills/app-builder/templates/cli-tool"
rm -rf ".agent/skills/app-builder/templates/electron-desktop"
rm -rf ".agent/skills/app-builder/templates/flutter-app"
rm -rf ".agent/skills/app-builder/templates/react-native-app"
rm -rf ".agent/skills/app-builder/templates/python-fastapi"
```

### 7. Remove Orphaned/Redundant Files (Phase 6)
// turbo
```bash
rm -f ".agent/skills/scaffold-module.ts"
rm -rf ".idx"
```

### 8. Merge Protocol Files (Phase 7)
*Manual Action Required*: Merge "Red Lines" from `.agent/AGENT_PROTOCOL.md` to `.agent/AGENTS.md`, then delete `AGENT_PROTOCOL.md`.

### 9. Verification
Run the bootstrap script to verify system integrity.
```bash
npx ts-node .agent/scripts/bootstrap.ts
```

### 10. Commit Changes
```bash
git add -A
git commit -m "chore: execute repository cleanup plan"
```

# Emergency Rollback Workflow

> **Risk Level**: 🟠 MEDIUM
> **Estimated Time**: < 1 minute
> **Tokens**: ~200

## What This Does
Reverts your project to a previous checkpoint when something goes wrong.

## When to Use
- AI made unwanted changes
- Build is broken
- Code doesn't work anymore
- Want to undo last operation

## How to Use

### Quick Rollback
```
Undo the last change
```

### Rollback to Checkpoint
```
Rollback to the last checkpoint
```

### View Available Checkpoints
```
Show me available rollback points
```

## What Happens

1. **Finds latest checkpoint** - Created automatically before risky operations
2. **Restores files** - Puts files back to their previous state
3. **Git stash pop** - Restores any stashed changes
4. **Confirms success** - Shows what was restored

## Example Output

```
╔═══════════════════════════════════════════════════════════╗
║              ROLLBACK COMPLETE                            ║
╠═══════════════════════════════════════════════════════════╣
║  Checkpoint: checkpoint-1707264000-abc123                 ║
║  Files Restored: 3                                        ║
║    - src/pages/about.astro                                ║
║    - src/components/Hero.astro                            ║
║    - src/styles/global.css                                ║
║  Git Stash: Applied                                       ║
╚═══════════════════════════════════════════════════════════╝
```

## Prevention Tips

Before risky operations, the system automatically:
- Creates git stash of uncommitted changes
- Backs up files that will be modified
- Shows risk level indicator

## If Rollback Fails

1. **Check git status**: `git status`
2. **Use git restore**: `git restore .`
3. **Use git stash list**: `git stash list`
4. **Manual restore**: Check `.agent/orchestration/backups/`

## Related Workflows
- [01-full-audit.md](01-full-audit.md) - Audit after rollback

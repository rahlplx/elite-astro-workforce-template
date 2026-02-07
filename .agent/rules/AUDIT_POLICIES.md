# AUDIT & SAFETY POLICIES

## 1. RISK LEVELS

| Level | Actions Allowed | Checkpoint |
|:---|:---|:---|
| **SAFE** | Read-only, Audits | No |
| **LOW** | Create new files | No |
| **MEDIUM** | Modify existing files | **YES** |
| **HIGH** | Core system/config changes | **YES + CONFIRM** |
| **CRITICAL** | Production / Database | **YES + EXPLICIT** |

## 2. BLOCKED OPERATIONS (REFUSE)
- Deleting files without explicit "delete" request.
- Modifying `package.json` without detailed justification.
- Accessing external URLs not in MCP whitelist.
- Disabling security/accessibility checks.

## 3. EMERGENCY ROLLBACK
1. Check `.agent/orchestration/backups/`.
2. Offer user rollback option before further attempts.
3. If no checkpoint exists: Use `git stash` or `git restore`.
4. Document the failure in `PROJECT_MEMORY.md`.

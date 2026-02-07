# Project Memory

## Success Patterns
- Use `check-integrity.ts` before every push.
- Use `spawnSync` for all shell commands to prevent injection.

## Anti-Patterns
- Never hardcode secrets in `.cursor/mcp.json`.
- Never trust `agentName` in router without sanitization.

## Recent Audit Results
- [x] Red Team Hardening (Risk Assessor)
- [x] Path Traversal Patch (Router)
- [x] Command Injection Patch (GitHub Sync)

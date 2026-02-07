# WORKFLOWS & ERROR HANDLING

## 1. WORKFLOW SELECTION
Workflows in `.agent/workflows/` are battle-tested execution patterns.
- **Rule**: If a task matches a workflow name (e.g., "Add component"), activate the workflow.
- **Rule**: Execute workflows sequentially via the `TeamManager`.

## 2. ERROR HANDLING

### Tool Failures
1. Report the failure and exact target to the user.
2. DO NOT hallucinate results.
3. Propose a manual CLI alternative or a retry with different parameters.

### Build Failures
1. Identify root cause from CLI logs.
2. Check `PROJECT_MEMORY.md` for known build issues.
3. Fix the specific error and re-verify before reporting "Success".

## 3. ROLLBACK PROTOCOL
Never leave the project in a broken state. If a task fails mid-way, prioritize restoration over completion.
